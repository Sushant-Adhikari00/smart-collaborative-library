import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from pydantic import BaseModel

from app.services.file_router import SUPPORTED_EXTENSIONS

logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────── Request / Response Models ────────────────────────


class ChatRequest(BaseModel):
    question: str
    document_id: str


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


class HealthResponse(BaseModel):
    status: str
    service: str
    documents_indexed: int


# ──────────────────────────── Endpoints ───────────────────────────────────────


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Returns the service health status."""
    from app.main import vector_store

    return HealthResponse(
        status="healthy",
        service="scl-ai-service",
        documents_indexed=vector_store.document_count if vector_store else 0,
    )


@router.post("/ai/process")
async def process_file(file: UploadFile = File(...), document_id: str = Form(...)):
    """
    Process an uploaded file through the full AI pipeline.

    Accepts: PDF, DOCX, TXT, CSV, XLSX, PNG, JPG, JPEG, MP4, MOV, AVI.

    Returns extracted text, AI-generated summary, and content type.
    """
    from app.main import document_service

    # Validate file extension
    _, ext = os.path.splitext(file.filename or "")
    ext = ext.lower()

    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type: '{ext}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
            ),
        )

    # Validate file size (read content length if available)
    from app.config import settings

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read()
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE_MB} MB",
        )
    # Reset file position after reading for size check
    await file.seek(0)

    try:
        result = await document_service.process_upload(file, document_id)

        return {
            "text": result["text"],
            "summary": result["summary"],
            "type": result["type"],
            "chunks_count": result["chunks_count"],
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"File processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )


class ProcessUrlRequest(BaseModel):
    url: str
    document_id: str

@router.post("/ai/process-url")
async def process_url(request: ProcessUrlRequest):
    """
    Process a file from a URL (e.g. Supabase public URL) through the full AI pipeline.
    """
    from app.main import document_service

    try:
        result = await document_service.process_url(request.url, request.document_id)

        return {
            "text": result["text"],
            "summary": result["summary"],
            "type": result["type"],
            "chunks_count": result["chunks_count"],
        }

    except Exception as e:
        logger.error(f"URL processing failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}",
        )

@router.post("/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Ask a question and get an AI-generated answer using RAG.

    The system retrieves relevant document chunks from the FAISS index
    and generates an answer using the Ollama LLM.
    """
    from app.main import retriever, llm_generator
    from app.config import settings

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    try:
        # Retrieve relevant chunks
        chunks = retriever.retrieve(
            request.question,
            request.document_id,
            top_k=settings.FAISS_TOP_K,
        )

        if not chunks:
            return ChatResponse(
                answer="No relevant documents found. Please upload documents first.",
                sources=[],
            )

        # Combine chunks into context
        context = "\n\n".join(chunks)

        # Generate answer
        answer = llm_generator.generate(request.question, context)

        return ChatResponse(
            answer=answer,
            sources=chunks,
        )

    except (ConnectionError, TimeoutError) as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}",
        )


class ChatMultiRequest(BaseModel):
    question: str
    document_ids: list[str]


@router.post("/ai/chat-multi", response_model=ChatResponse)
async def chat_multi(request: ChatMultiRequest):
    """
    Ask a question across multiple documents (main doc + shared resources).

    Retrieves relevant chunks from all provided document IDs, merges them,
    and generates a single unified answer. Used by the Shared AI workspace tab.
    """
    from app.main import retriever, llm_generator
    from app.config import settings

    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    if not request.document_ids:
        raise HTTPException(status_code=400, detail="At least one document_id is required")

    try:
        # Retrieve chunks from each document ID and merge them
        all_chunks: list[str] = []
        for doc_id in request.document_ids:
            if not doc_id:
                continue
            chunks = retriever.retrieve(
                request.question,
                doc_id,
                top_k=settings.FAISS_TOP_K,
            )
            all_chunks.extend(chunks)

        if not all_chunks:
            return ChatResponse(
                answer=(
                    "No relevant content found across the workspace documents. "
                    "Make sure documents have been uploaded and processed by the AI service."
                ),
                sources=[],
            )

        # Deduplicate identical chunks that may exist across docs
        seen: set[str] = set()
        unique_chunks: list[str] = []
        for chunk in all_chunks:
            if chunk not in seen:
                seen.add(chunk)
                unique_chunks.append(chunk)

        # Combine into context (cap at top_k * 2 chunks to avoid token overflow)
        max_chunks = settings.FAISS_TOP_K * 2
        context = "\n\n".join(unique_chunks[:max_chunks])

        # Generate answer
        answer = llm_generator.generate(request.question, context)

        return ChatResponse(
            answer=answer,
            sources=unique_chunks[:max_chunks],
        )

    except (ConnectionError, TimeoutError) as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Multi-doc chat failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Chat processing failed: {str(e)}",
        )

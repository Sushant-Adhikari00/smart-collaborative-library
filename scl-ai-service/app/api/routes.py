import os
import logging
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.file_router import SUPPORTED_EXTENSIONS

logger = logging.getLogger(__name__)

router = APIRouter()


# ──────────────────────────── Request / Response Models ────────────────────────


class ChatRequest(BaseModel):
    question: str


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
async def process_file(file: UploadFile = File(...)):
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
        result = await document_service.process_upload(file)

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

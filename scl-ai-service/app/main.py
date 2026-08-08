import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.embeddings.embedder import EmbeddingService
from app.vectorstore.faiss_store import FAISSVectorStore
from app.rag.retriever import Retriever
from app.llm.generator import LLMGenerator
from app.services.summary_service import SummaryService
from app.services.document_service import DocumentService
from app.api.routes import router

# ──────────────────────────── Logging ─────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ──────────────────────────── Global Instances ────────────────────────────────
# These are initialized once at startup via the lifespan handler
# and shared across all requests for performance.

embedding_service: EmbeddingService | None = None
vector_store: FAISSVectorStore | None = None
retriever: Retriever | None = None
llm_generator: LLMGenerator | None = None
summary_service: SummaryService | None = None
document_service: DocumentService | None = None


# ──────────────────────────── Lifespan ────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize all AI models and services at startup."""
    global embedding_service, vector_store, retriever
    global llm_generator, summary_service, document_service

    logger.info("=" * 60)
    logger.info("SCL AI Service starting up...")
    logger.info("=" * 60)

    # 1. Load embedding model
    logger.info("Loading embedding model...")
    embedding_service = EmbeddingService(
        model_name=settings.EMBEDDING_MODEL,
        api_key=settings.GOOGLE_API_KEY,
    )

    # 2. Initialize FAISS vector store with persistence
    logger.info("Initializing FAISS vector store...")
    vector_store = FAISSVectorStore(
        dimension=embedding_service.dimension,
        persist_dir=settings.FAISS_INDEX_DIR,
    )

    # 3. Initialize retriever
    retriever = Retriever(
        vector_store=vector_store,
        embedding_service=embedding_service,
    )

    # 4. Initialize LLM generator (uses Groq if GROQ_API_KEY is set, else Ollama)
    llm_generator = LLMGenerator(
        groq_api_key=settings.GROQ_API_KEY,
        groq_model=settings.GROQ_MODEL,
        ollama_base_url=settings.OLLAMA_BASE_URL,
        ollama_model=settings.OLLAMA_MODEL,
        timeout=settings.LLM_TIMEOUT,
    )

    # 5. Initialize summary service
    summary_service = SummaryService(llm_generator=llm_generator)

    # 6. Initialize document service
    document_service = DocumentService(
        embedding_service=embedding_service,
        vector_store=vector_store,
        summary_service=summary_service,
        upload_dir=settings.UPLOAD_DIR,
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )

    logger.info("=" * 60)
    logger.info("SCL AI Service ready!")
    logger.info(f"  Embedding model : {settings.EMBEDDING_MODEL}")
    logger.info(f"  LLM model       : {settings.OLLAMA_MODEL}")
    logger.info(f"  FAISS documents : {vector_store.document_count}")
    logger.info(f"  Upload dir      : {settings.UPLOAD_DIR}")
    logger.info(f"  FAISS persist   : {settings.FAISS_INDEX_DIR}")
    logger.info("=" * 60)

    yield  # Application is running

    # Shutdown
    logger.info("SCL AI Service shutting down...")


# ──────────────────────────── FastAPI App ──────────────────────────────────────

app = FastAPI(
    title="SCL AI Service",
    description="AI-powered microservice for Smart Collaborative Learning platform. "
    "Supports multi-format file processing, RAG-based Q&A, and AI summarization.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routes
app.include_router(router)


@app.get("/")
def root():
    """Root endpoint — basic service status."""
    return {"message": "SCL AI Service Running"}
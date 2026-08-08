from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Ollama LLM (local fallback)
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    # Groq API (cloud, preferred)
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.1-8b-instant"

    # Google Generative AI (Gemini embeddings)
    GOOGLE_API_KEY: str = ""

    # Embedding model (Gemini API — no local torch required)
    EMBEDDING_MODEL: str = "models/text-embedding-004"

    # File handling
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE_MB: int = 50

    # Text processing
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 100

    # FAISS
    FAISS_TOP_K: int = 5
    FAISS_INDEX_DIR: str = "faiss_data"

    # LLM
    LLM_TIMEOUT: int = 120

    # Supabase (optional vector store)
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()

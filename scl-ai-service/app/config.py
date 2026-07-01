from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application configuration loaded from environment variables."""

    # Ollama LLM
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.1"

    # Embedding model
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

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

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()

import numpy as np
from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Manages the sentence-transformer model and generates embeddings."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_embedding_dimension()
        logger.info(f"Embedding model loaded (dimension={self.dimension})")

    def embed(self, texts: list[str]) -> np.ndarray:
        """Generate embeddings for a list of text chunks."""
        if not texts:
            return np.array([], dtype="float32")
        embeddings = self.model.encode(texts, show_progress_bar=False)
        return np.array(embeddings, dtype="float32")

    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query string."""
        return self.model.encode([query], show_progress_bar=False)[0].astype("float32")
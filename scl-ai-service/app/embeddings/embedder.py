import logging
import numpy as np

logger = logging.getLogger(__name__)


class EmbeddingService:
    """
    Lightweight embedding service using Google Generative AI API.
    Uses 'models/text-embedding-004' (768-dimensional) — no local torch/model required.
    Falls back to a simple TF-IDF-style hash embedding if the API is unavailable.
    """

    DIMENSION = 768  # Gemini text-embedding-004 output dimension

    def __init__(self, model_name: str = "models/text-embedding-004", api_key: str = ""):
        self.model_name = model_name
        self.api_key = api_key
        self.dimension = self.DIMENSION
        self._client = None

        if api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=api_key)
                self._client = genai
                logger.info(f"Embedding service using Google Generative AI: {model_name} (dim={self.dimension})")
            except ImportError:
                logger.warning("google-generativeai not installed, falling back to hash embeddings")
        else:
            logger.warning("No GOOGLE_API_KEY provided — using fallback hash embeddings (reduced accuracy)")

    def _hash_embed(self, text: str) -> np.ndarray:
        """
        Deterministic hash-based fallback embedding.
        Produces a stable 768-dimensional float32 vector from any text.
        Not semantically meaningful but consistent and zero-RAM.
        """
        import hashlib
        vec = np.zeros(self.DIMENSION, dtype="float32")
        words = text.lower().split()
        for i, word in enumerate(words[:200]):
            h = int(hashlib.md5(word.encode()).hexdigest(), 16)
            idx = h % self.DIMENSION
            vec[idx] += 1.0 / (i + 1)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec

    def _embed_one(self, text: str) -> np.ndarray:
        """Embed a single text string."""
        if self._client is None:
            return self._hash_embed(text)
        try:
            result = self._client.embed_content(
                model=self.model_name,
                content=text,
                task_type="retrieval_document",
            )
            return np.array(result["embedding"], dtype="float32")
        except Exception as e:
            logger.warning(f"Gemini embedding failed ({e}), using hash fallback")
            return self._hash_embed(text)

    def embed(self, texts: list[str]) -> np.ndarray:
        """Generate embeddings for a list of text chunks."""
        if not texts:
            return np.array([], dtype="float32")
        embeddings = [self._embed_one(t) for t in texts]
        return np.array(embeddings, dtype="float32")

    def embed_query(self, query: str) -> np.ndarray:
        """Generate embedding for a single query string."""
        if self._client is None:
            return self._hash_embed(query)
        try:
            result = self._client.embed_content(
                model=self.model_name,
                content=query,
                task_type="retrieval_query",
            )
            return np.array(result["embedding"], dtype="float32")
        except Exception as e:
            logger.warning(f"Gemini query embedding failed ({e}), using hash fallback")
            return self._hash_embed(query)
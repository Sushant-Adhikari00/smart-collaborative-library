import faiss
import numpy as np
import threading
import pickle
import os
import logging

logger = logging.getLogger(__name__)


class FAISSVectorStore:
    """
    Thread-safe FAISS vector store with disk persistence.
    Stores document chunks alongside their vector embeddings.
    """

    def __init__(self, dimension: int, persist_dir: str | None = None):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks: list[str] = []
        self._lock = threading.Lock()
        self._persist_dir = persist_dir

        # Try to load existing index from disk
        if persist_dir:
            self._load_from_disk()

    @property
    def document_count(self) -> int:
        """Return the number of documents in the store."""
        return len(self.chunks)

    def add_documents(self, chunks: list[str], embeddings: np.ndarray) -> None:
        """Add document chunks and their embeddings to the store."""
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings"
            )

        vectors = np.array(embeddings, dtype="float32")

        with self._lock:
            self.chunks.extend(chunks)
            self.index.add(vectors)
            logger.info(
                f"Added {len(chunks)} documents (total: {self.document_count})"
            )

            # Persist to disk after adding
            if self._persist_dir:
                self._save_to_disk()

    def search(self, query_embedding: np.ndarray, top_k: int = 5) -> list[str]:
        """Search for the top-k most similar chunks."""
        with self._lock:
            if self.document_count == 0:
                logger.warning("Search called on empty FAISS index")
                return []

            # Clamp top_k to available documents
            effective_k = min(top_k, self.document_count)

            query_vector = np.array([query_embedding], dtype="float32")
            distances, indices = self.index.search(query_vector, effective_k)

            results = []
            for idx in indices[0]:
                if 0 <= idx < len(self.chunks):
                    results.append(self.chunks[idx])

            logger.debug(f"Search returned {len(results)} results")
            return results

    def _save_to_disk(self) -> None:
        """Persist the FAISS index and chunks to disk."""
        try:
            os.makedirs(self._persist_dir, exist_ok=True)
            index_path = os.path.join(self._persist_dir, "faiss.index")
            chunks_path = os.path.join(self._persist_dir, "chunks.pkl")

            faiss.write_index(self.index, index_path)
            with open(chunks_path, "wb") as f:
                pickle.dump(self.chunks, f)

            logger.info(f"FAISS index persisted to {self._persist_dir}")
        except Exception as e:
            logger.error(f"Failed to persist FAISS index: {e}")

    def _load_from_disk(self) -> None:
        """Load the FAISS index and chunks from disk if they exist."""
        index_path = os.path.join(self._persist_dir, "faiss.index")
        chunks_path = os.path.join(self._persist_dir, "chunks.pkl")

        if os.path.exists(index_path) and os.path.exists(chunks_path):
            try:
                self.index = faiss.read_index(index_path)
                with open(chunks_path, "rb") as f:
                    self.chunks = pickle.load(f)
                logger.info(
                    f"Loaded FAISS index from disk ({self.document_count} documents)"
                )
            except Exception as e:
                logger.error(f"Failed to load FAISS index from disk: {e}")
                # Reset to empty state
                self.index = faiss.IndexFlatL2(self.dimension)
                self.chunks = []
        else:
            logger.info("No existing FAISS index found, starting fresh")
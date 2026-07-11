import faiss
import numpy as np
import threading
import pickle
import os
import logging
from typing import Dict, List, Tuple

logger = logging.getLogger(__name__)

class DocumentFAISSIndex:
    """Represents a FAISS index and chunk list for a single document."""
    def __init__(self, dimension: int):
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks: List[str] = []
        self.lock = threading.Lock()

class FAISSVectorStore:
    """
    Thread-safe FAISS vector store with disk persistence.
    Manages separate FAISS indices for each document_id.
    """

    def __init__(self, dimension: int, persist_dir: str | None = None):
        self.dimension = dimension
        self.persist_dir = persist_dir
        # Map of document_id -> DocumentFAISSIndex
        self.document_indices: Dict[str, DocumentFAISSIndex] = {}
        self._global_lock = threading.Lock()
        
        if persist_dir:
            os.makedirs(persist_dir, exist_ok=True)

    def _get_or_create_index(self, document_id: str) -> DocumentFAISSIndex:
        with self._global_lock:
            if document_id not in self.document_indices:
                doc_index = DocumentFAISSIndex(self.dimension)
                self.document_indices[document_id] = doc_index
                self._load_from_disk(document_id, doc_index)
            return self.document_indices[document_id]

    @property
    def document_count(self) -> int:
        """Return the number of total indexed chunks across all documents."""
        with self._global_lock:
            return sum(len(idx.chunks) for idx in self.document_indices.values())

    def get_document_chunk_count(self, document_id: str) -> int:
        """Return the number of chunks for a specific document."""
        doc_index = self._get_or_create_index(document_id)
        with doc_index.lock:
            return len(doc_index.chunks)

    def add_documents(self, chunks: List[str], embeddings: np.ndarray, document_id: str) -> None:
        """Add document chunks and their embeddings to the store for a specific document_id."""
        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings"
            )

        if not document_id:
            raise ValueError("document_id is required to add documents.")

        doc_index = self._get_or_create_index(document_id)
        vectors = np.array(embeddings, dtype="float32")

        with doc_index.lock:
            doc_index.chunks.extend(chunks)
            doc_index.index.add(vectors)
            logger.info(
                f"Added {len(chunks)} documents to index {document_id} (total for doc: {len(doc_index.chunks)})"
            )

            if self.persist_dir:
                self._save_to_disk(document_id, doc_index)

    def search(self, query_embedding: np.ndarray, document_id: str, top_k: int = 5) -> List[str]:
        """Search for the top-k most similar chunks within a specific document."""
        if not document_id:
            logger.warning("Search called without document_id")
            return []

        doc_index = self._get_or_create_index(document_id)

        with doc_index.lock:
            if len(doc_index.chunks) == 0:
                logger.warning(f"Search called on empty FAISS index for document {document_id}")
                return []

            effective_k = min(top_k, len(doc_index.chunks))
            query_vector = np.array([query_embedding], dtype="float32")
            distances, indices = doc_index.index.search(query_vector, effective_k)

            results = []
            for idx in indices[0]:
                if 0 <= idx < len(doc_index.chunks):
                    results.append(doc_index.chunks[idx])

            logger.debug(f"Search returned {len(results)} results for document {document_id}")
            return results

    def _save_to_disk(self, document_id: str, doc_index: DocumentFAISSIndex) -> None:
        """Persist the FAISS index and chunks for a specific document to disk."""
        try:
            index_path = os.path.join(self.persist_dir, f"{document_id}.index")
            chunks_path = os.path.join(self.persist_dir, f"{document_id}_chunks.pkl")

            faiss.write_index(doc_index.index, index_path)
            with open(chunks_path, "wb") as f:
                pickle.dump(doc_index.chunks, f)

            logger.debug(f"FAISS index persisted to {index_path}")
        except Exception as e:
            logger.error(f"Failed to persist FAISS index for {document_id}: {e}")

    def _load_from_disk(self, document_id: str, doc_index: DocumentFAISSIndex) -> None:
        """Load the FAISS index and chunks for a specific document from disk if they exist."""
        if not self.persist_dir:
            return

        index_path = os.path.join(self.persist_dir, f"{document_id}.index")
        chunks_path = os.path.join(self.persist_dir, f"{document_id}_chunks.pkl")

        if os.path.exists(index_path) and os.path.exists(chunks_path):
            try:
                doc_index.index = faiss.read_index(index_path)
                with open(chunks_path, "rb") as f:
                    doc_index.chunks = pickle.load(f)
                logger.info(
                    f"Loaded FAISS index for {document_id} from disk ({len(doc_index.chunks)} chunks)"
                )
            except Exception as e:
                logger.error(f"Failed to load FAISS index for {document_id} from disk: {e}")
                doc_index.index = faiss.IndexFlatL2(self.dimension)
                doc_index.chunks = []
        else:
            logger.info(f"No existing FAISS index found for {document_id}, starting fresh")
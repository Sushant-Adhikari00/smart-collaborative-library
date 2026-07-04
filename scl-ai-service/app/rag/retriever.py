import logging

logger = logging.getLogger(__name__)


class Retriever:
    """Retrieves relevant document chunks using semantic search."""

    def __init__(self, vector_store, embedding_service):
        self.vector_store = vector_store
        self.embedding_service = embedding_service

    def retrieve(self, query: str, top_k: int = 5) -> list[str]:
        """
        Convert a query into an embedding, search the vector store,
        and return the top-k most relevant chunks.
        """
        if self.vector_store.document_count == 0:
            logger.warning("Retriever called but vector store is empty")
            return []

        query_embedding = self.embedding_service.embed_query(query)
        results = self.vector_store.search(query_embedding, top_k=top_k)

        logger.info(f"Retrieved {len(results)} chunks for query: '{query[:80]}...'")
        return results
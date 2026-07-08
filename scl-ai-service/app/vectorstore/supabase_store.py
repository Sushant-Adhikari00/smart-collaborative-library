import logging
import numpy as np
from supabase import create_client, Client

logger = logging.getLogger(__name__)


class SupabaseVectorStore:
    """
    Supabase vector store using pgvector.
    Stores document chunks and their vector embeddings in Supabase Postgres.
    """

    def __init__(self, supabase_url: str, supabase_key: str):
        if not supabase_url or not supabase_key:
            logger.warning("Supabase URL or Key not provided. Vector store will fail.")
            self.client = None
        else:
            self.client: Client = create_client(supabase_url, supabase_key)
        
        # We can try to query document count here if needed, but not strictly necessary.
        self._document_count = 0

    @property
    def document_count(self) -> int:
        """Return the number of documents in the store."""
        # Due to performance reasons, we don't count every time unless requested.
        # Here we just try to return a loose count.
        try:
            response = self.client.table("ai_documents").select("id", count="exact").execute()
            if response.count is not None:
                self._document_count = response.count
        except Exception as e:
            logger.error(f"Failed to get document count from Supabase: {e}")
        return self._document_count

    def add_documents(self, chunks: list[str], embeddings: list[list[float]] | np.ndarray) -> None:
        """Add document chunks and their embeddings to the store."""
        if not self.client:
            raise ValueError("Supabase client is not initialized. Please ensure SUPABASE_URL and SUPABASE_KEY are set.")

        if len(chunks) != len(embeddings):
            raise ValueError(
                f"Mismatch: {len(chunks)} chunks vs {len(embeddings)} embeddings"
            )

        # Convert embeddings to lists if they are numpy arrays
        if isinstance(embeddings, np.ndarray):
            embeddings_list = embeddings.tolist()
        else:
            embeddings_list = embeddings

        records = []
        for chunk, embedding in zip(chunks, embeddings_list):
            records.append({
                "content": chunk,
                "embedding": embedding
            })

        if not records:
            return

        try:
            # Batch insert
            self.client.table("ai_documents").insert(records).execute()
            logger.info(f"Added {len(chunks)} documents to Supabase vector store")
        except Exception as e:
            logger.error(f"Failed to insert documents into Supabase: {e}")
            raise

    def search(self, query_embedding: np.ndarray | list[float], top_k: int = 5) -> list[str]:
        """Search for the top-k most similar chunks using the match_documents RPC."""
        if not self.client:
            logger.error("Supabase client is not initialized. Cannot perform search.")
            return []

        if isinstance(query_embedding, np.ndarray):
            query_vector = query_embedding.tolist()
        else:
            query_vector = query_embedding
            
        # The retriever sends a single embedding, but earlier in FAISS it might be a 1D array.
        # Make sure it's flat list of floats.
        if len(query_vector) == 1 and isinstance(query_vector[0], list):
            query_vector = query_vector[0]

        try:
            response = self.client.rpc(
                "match_documents",
                {
                    "query_embedding": query_vector,
                    "match_threshold": 0.0, # We can adjust this if needed
                    "match_count": top_k
                }
            ).execute()
            
            results = []
            if response.data:
                for row in response.data:
                    results.append(row["content"])
            
            logger.debug(f"Search returned {len(results)} results from Supabase")
            return results
        except Exception as e:
            logger.error(f"Failed to search Supabase vector store: {e}")
            return []

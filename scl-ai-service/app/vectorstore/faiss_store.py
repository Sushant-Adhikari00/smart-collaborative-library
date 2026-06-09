import faiss
import numpy as np


class FAISSVectorStore:
    def __init__(self, dimension: int):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.chunks = []

    def add_documents(self, chunks, embeddings):
        self.chunks.extend(chunks)

        vectors = np.array(embeddings).astype("float32")
        self.index.add(vectors)

    def search(self, query_embedding, top_k=5):
        query_vector = np.array([query_embedding]).astype("float32")

        distances, indices = self.index.search(query_vector, top_k)

        results = []

        for idx in indices[0]:
            if idx < len(self.chunks):
                results.append(self.chunks[idx])

        return results
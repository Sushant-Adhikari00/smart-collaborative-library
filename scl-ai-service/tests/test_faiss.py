import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.pdf import process_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import EmbeddingService
from app.vectorstore.faiss_store import FAISSVectorStore


def test_faiss():
    # Step 1: Extract
    result = process_pdf("Chapter1-MobApp.pdf")
    text = result["text"]

    # Step 2: Clean
    cleaned = clean_text(text)

    # Step 3: Chunk
    chunks = chunk_text(cleaned)

    # Step 4: Embeddings
    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)

    # Step 5: FAISS setup
    store = FAISSVectorStore(dimension=embedder.dimension)

    store.add_documents(chunks, embeddings)

    # Step 6: Test search (using first chunk as fake query)
    results = store.search(embeddings[0], top_k=3)

    print("\n🔍 TOP RESULTS:\n")

    for r in results:
        print("-", r[:200], "\n")


if __name__ == "__main__":
    test_faiss()
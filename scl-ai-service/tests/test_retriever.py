import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.pdf import process_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import EmbeddingService
from app.vectorstore.faiss_store import FAISSVectorStore
from app.rag.retriever import Retriever


def test_retriever():

    # Load PDF
    result = process_pdf("Chapter1-MobApp.pdf")
    text = result["text"]

    # Clean
    cleaned = clean_text(text)

    # Chunk
    chunks = chunk_text(cleaned)

    # Embed
    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)

    # Store
    store = FAISSVectorStore(dimension=embedder.dimension)

    store.add_documents(
        chunks,
        embeddings
    )

    # Retriever
    retriever = Retriever(store, embedder)

    question = input("\nAsk a question: ")

    results = retriever.retrieve(question)

    print("\n===== RETRIEVED CHUNKS =====\n")

    for i, chunk in enumerate(results, start=1):
        print(f"\nChunk {i}:\n")
        print(chunk[:500])


if __name__ == "__main__":
    test_retriever()
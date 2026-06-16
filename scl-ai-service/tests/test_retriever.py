import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.extractors.pdf_extractor import extract_text_from_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import get_embeddings
from app.vectorstore.faiss_store import FAISSVectorStore
from app.rag.retriever import Retriever


def test_retriever():

    # Load PDF
    text = extract_text_from_pdf("Chapter1-MobApp.pdf")

    # Clean
    cleaned = clean_text(text)

    # Chunk
    chunks = chunk_text(cleaned)

    # Embed
    embeddings = get_embeddings(chunks)

    # Store
    dimension = len(embeddings[0])

    store = FAISSVectorStore(dimension)

    store.add_documents(
        chunks,
        embeddings
    )

    # Retriever
    retriever = Retriever(store)

    question = input("\nAsk a question: ")

    results = retriever.retrieve(question)

    print("\n===== RETRIEVED CHUNKS =====\n")

    for i, chunk in enumerate(results, start=1):
        print(f"\nChunk {i}:\n")
        print(chunk[:500])


if __name__ == "__main__":
    test_retriever()
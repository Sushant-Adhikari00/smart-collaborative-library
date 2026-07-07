import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.pdf import process_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import EmbeddingService


def test_embeddings():
    result = process_pdf("Chapter1-MobApp.pdf")
    text = result["text"]

    cleaned = clean_text(text)

    chunks = chunk_text(cleaned)

    embedder = EmbeddingService()
    vectors = embedder.embed(chunks)

    print("\nTotal Chunks:", len(chunks))
    print("Embedding Shape:", vectors.shape)


if __name__ == "__main__":
    test_embeddings()
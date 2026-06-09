import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.extractors.pdf_extractor import extract_text_from_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import get_embeddings


def test_embeddings():
    text = extract_text_from_pdf("Chapter1-MobApp.pdf")

    cleaned = clean_text(text)

    chunks = chunk_text(cleaned)

    vectors = get_embeddings(chunks)

    print("\nTotal Chunks:", len(chunks))
    print("Embedding Shape:", len(vectors), len(vectors[0]))


if __name__ == "__main__":
    test_embeddings()
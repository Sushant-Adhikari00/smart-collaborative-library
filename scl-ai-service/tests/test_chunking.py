import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.pdf import process_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text


def test_chunking():
    result = process_pdf("Chapter1-MobApp.pdf")
    text = result["text"]

    cleaned = clean_text(text)

    chunks = chunk_text(cleaned)

    print(f"\nTotal Chunks: {len(chunks)}\n")

    for i, chunk in enumerate(chunks[:3]):
        print(f"\nChunk {i+1}\n")
        print(chunk)
        print("-" * 50)


if __name__ == "__main__":
    test_chunking()
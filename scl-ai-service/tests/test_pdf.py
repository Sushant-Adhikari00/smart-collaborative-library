import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.extractors.pdf_extractor import extract_text_from_pdf


def test_pdf_extraction():
    file_path = "Chapter1-MobApp.pdf"

    text = extract_text_from_pdf(file_path)

    print("\n========== EXTRACTED TEXT ==========\n")
    print(text[:2000])

    assert text is not None
    assert len(text) > 0


if __name__ == "__main__":
    test_pdf_extraction()
import fitz  # PyMuPDF
import logging

logger = logging.getLogger(__name__)


def process_pdf(file_path: str) -> dict:
    """Extract text from a PDF file using PyMuPDF."""
    try:
        doc = fitz.open(file_path)
        text_parts = []

        for page in doc:
            page_text = page.get_text()
            if page_text:
                text_parts.append(page_text)

        doc.close()

        text = "\n".join(text_parts).strip()
        if not text:
            raise ValueError("No text could be extracted from the PDF")

        logger.info(f"Extracted {len(text)} characters from PDF: {file_path}")
        return {"text": text, "type": "pdf"}

    except Exception as e:
        logger.error(f"Failed to process PDF {file_path}: {e}")
        raise

import logging

logger = logging.getLogger(__name__)

# Lazy-initialized global reader for performance
_reader = None


def _get_reader():
    """Lazy-initialize EasyOCR reader (heavy model load)."""
    global _reader
    if _reader is None:
        try:
            import easyocr
        except ImportError:
            raise ImportError(
                "easyocr is required for image processing. "
                "Install it with: pip install easyocr"
            )
        logger.info(
            "Initializing EasyOCR reader (first-time model download may take a while)..."
        )
        _reader = easyocr.Reader(["en"], gpu=False)
        logger.info("EasyOCR reader initialized successfully")
    return _reader


def process_image(file_path: str) -> dict:
    """Extract text from an image using EasyOCR."""
    try:
        reader = _get_reader()
        results = reader.readtext(file_path, detail=0)

        text = "\n".join(results).strip()
        if not text:
            raise ValueError("No text could be extracted from the image")

        logger.info(f"Extracted {len(text)} characters from image: {file_path}")
        return {"text": text, "type": "image"}

    except Exception as e:
        logger.error(f"Failed to process image {file_path}: {e}")
        raise

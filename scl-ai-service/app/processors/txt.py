import logging

logger = logging.getLogger(__name__)


def process_txt(file_path: str) -> dict:
    """Read text from a plain text file with encoding fallback."""
    try:
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        text = None

        for encoding in encodings:
            try:
                with open(file_path, "r", encoding=encoding) as f:
                    text = f.read().strip()
                break
            except UnicodeDecodeError:
                continue

        if text is None:
            raise ValueError("Could not decode text file with any supported encoding")
        if not text:
            raise ValueError("Text file is empty")

        logger.info(f"Read {len(text)} characters from TXT: {file_path}")
        return {"text": text, "type": "txt"}

    except Exception as e:
        logger.error(f"Failed to process TXT {file_path}: {e}")
        raise

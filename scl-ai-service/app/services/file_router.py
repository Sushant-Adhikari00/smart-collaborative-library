import os
import logging

from app.processors.pdf import process_pdf
from app.processors.docx import process_docx
from app.processors.txt import process_txt
from app.processors.csv_processor import process_csv
from app.processors.xlsx import process_xlsx
from app.processors.image import process_image
from app.processors.video import process_video

logger = logging.getLogger(__name__)

# Map file extensions to their processor functions
EXTENSION_MAP = {
    # Documents
    ".pdf": process_pdf,
    ".docx": process_docx,
    ".txt": process_txt,
    ".csv": process_csv,
    ".xlsx": process_xlsx,
    # Images (OCR)
    ".png": process_image,
    ".jpg": process_image,
    ".jpeg": process_image,
    # Video (transcription)
    ".mp4": process_video,
    ".mov": process_video,
    ".avi": process_video,
}

# Categorize extensions for response type
DOCUMENT_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".xlsx"}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".avi"}

SUPPORTED_EXTENSIONS = set(EXTENSION_MAP.keys())


def get_file_type_category(extension: str) -> str:
    """Return the category of a file based on its extension."""
    ext = extension.lower()
    if ext in DOCUMENT_EXTENSIONS:
        return "document"
    elif ext in IMAGE_EXTENSIONS:
        return "image"
    elif ext in VIDEO_EXTENSIONS:
        return "video"
    return "unknown"


def route_file(file_path: str) -> dict:
    """
    Detect file type by extension and route to the correct processor.

    Args:
        file_path: Path to the file to process.

    Returns:
        dict with keys: text, type

    Raises:
        ValueError: If the file type is not supported.
        FileNotFoundError: If the file does not exist.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    _, ext = os.path.splitext(file_path)
    ext = ext.lower()

    if ext not in EXTENSION_MAP:
        raise ValueError(
            f"Unsupported file type: '{ext}'. "
            f"Supported types: {', '.join(sorted(SUPPORTED_EXTENSIONS))}"
        )

    processor = EXTENSION_MAP[ext]
    logger.info(f"Routing file '{file_path}' (type={ext}) to {processor.__name__}")

    return processor(file_path)

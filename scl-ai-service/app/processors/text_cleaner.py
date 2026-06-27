import re
import unicodedata
import logging

logger = logging.getLogger(__name__)


def clean_text(text: str) -> str:
    """
    Clean extracted text by removing noise, normalizing whitespace,
    and stripping non-printable characters.
    """
    if not text:
        return ""

    # Unicode normalization (NFKC)
    text = unicodedata.normalize("NFKC", text)

    # Remove non-printable characters (keep newlines and tabs)
    text = "".join(
        ch for ch in text
        if unicodedata.category(ch)[0] != "C" or ch in "\n\t"
    )

    # Remove common header/footer noise patterns
    text = re.sub(r"Page \d+ of \d+", "", text)
    text = re.sub(r"\bPage\s*\d+\b", "", text, flags=re.IGNORECASE)

    # Collapse multiple blank lines into one
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Replace multiple spaces/tabs with single space (per line)
    text = re.sub(r"[^\S\n]+", " ", text)

    # Strip leading/trailing whitespace from each line
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(lines)

    # Final strip
    text = text.strip()

    logger.debug(f"Cleaned text: {len(text)} characters")
    return text
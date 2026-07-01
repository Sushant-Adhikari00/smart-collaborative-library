import logging

logger = logging.getLogger(__name__)


def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 100,
) -> list[str]:
    """
    Split text into overlapping chunks for embedding generation,
    aligning splits with word boundaries (whitespaces) to avoid cutting words in half.

    Args:
        text: The input text to chunk.
        chunk_size: Maximum number of characters per chunk.
        overlap: Number of overlapping characters between consecutive chunks.

    Returns:
        A list of text chunks.
    """
    if not text:
        return []

    if chunk_size <= 0:
        raise ValueError("chunk_size must be positive")
    if overlap < 0 or overlap >= chunk_size:
        raise ValueError("overlap must be >= 0 and < chunk_size")

    chunks = []
    start = 0

    while start < len(text):
        # If the remaining text fits in one chunk, take it and stop
        if len(text) - start <= chunk_size:
            chunk = text[start:]
            if chunk.strip():
                chunks.append(chunk)
            break

        end = start + chunk_size

        # Find a space character to split on, searching backwards from the end
        # up to the overlap length to ensure we don't reduce chunk size too much.
        lookback = max(start, end - overlap)
        split_idx = text.rfind(" ", lookback, end)

        if split_idx != -1 and split_idx > start:
            end = split_idx

        chunk = text[start:end]
        if chunk.strip():
            chunks.append(chunk)

        # Advance start based on where the chunk actually ended
        start = end - overlap

    logger.info(f"Split text into {len(chunks)} chunks (size={chunk_size}, overlap={overlap})")
    return chunks
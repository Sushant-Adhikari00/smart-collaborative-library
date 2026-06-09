def chunk_text(
    text: str,
    chunk_size: int = 500,
    overlap: int = 100
):
    """
    Split text into overlapping chunks.
    """

    chunks = []

    start = 0

    while start < len(text):
        end = start + chunk_size

        chunk = text[start:end]

        chunks.append(chunk)

<<<<<<< HEAD
        start += chunk_size - overlap
=======
        start += chunk_size - overlapgit
>>>>>>> origin/development

    return chunks
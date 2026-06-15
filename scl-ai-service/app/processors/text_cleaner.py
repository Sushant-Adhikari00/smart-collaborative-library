import re


def clean_text(text: str) -> str:
    """
    Clean extracted PDF text.
    """

    # Replace multiple spaces
    text = re.sub(r"\s+", " ", text)

    # Remove leading/trailing spaces
    text = text.strip()

    return text
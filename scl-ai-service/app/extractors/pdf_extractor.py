import fitz  # PyMuPDF


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from a PDF using PyMuPDF.
    Works for normal text-based PDFs.
    """

    try:
        doc = fitz.open(file_path)
        text = []

        for page in doc:
            page_text = page.get_text()

            if page_text:
                text.append(page_text)

        doc.close()

        return "\n".join(text).strip()

    except Exception as e:
        return f"Error reading PDF: {str(e)}"
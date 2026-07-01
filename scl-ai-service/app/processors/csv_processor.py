import csv
import logging

logger = logging.getLogger(__name__)


def process_csv(file_path: str) -> dict:
    """Extract text from a CSV file by flattening rows into readable text."""
    try:
        rows = []

        with open(file_path, "r", encoding="utf-8-sig") as f:
            reader = csv.reader(f)
            headers = next(reader, None)

            if headers:
                rows.append(" | ".join(h.strip() for h in headers))
                rows.append("-" * 40)

            for row in reader:
                row_text = " | ".join(cell.strip() for cell in row if cell.strip())
                if row_text:
                    rows.append(row_text)

        text = "\n".join(rows).strip()
        if not text:
            raise ValueError("No data could be extracted from the CSV file")

        logger.info(f"Extracted {len(rows)} rows from CSV: {file_path}")
        return {"text": text, "type": "csv"}

    except Exception as e:
        logger.error(f"Failed to process CSV {file_path}: {e}")
        raise

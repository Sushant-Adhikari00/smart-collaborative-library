import logging

logger = logging.getLogger(__name__)


class SummaryService:
    """Generates summaries, key points, and keywords using the LLM."""

    def __init__(self, llm_generator):
        self.llm = llm_generator

    def generate_summary(self, text: str) -> dict:
        """
        Generate a structured summary from extracted text.

        Args:
            text: The cleaned, extracted text content.

        Returns:
            dict with keys: summary, key_points, keywords
        """
        if not text or not text.strip():
            logger.warning("Empty text provided for summarization")
            return {
                "summary": "No content available to summarize.",
                "key_points": [],
                "keywords": [],
            }

        try:
            logger.info(f"Generating summary for {len(text)} characters of text")
            result = self.llm.summarize(text)
            logger.info("Summary generated successfully")
            return result

        except (ConnectionError, TimeoutError) as e:
            logger.error(f"LLM unavailable for summarization: {e}")
            return {
                "summary": f"Summary unavailable: {str(e)}",
                "key_points": [],
                "keywords": [],
            }
        except Exception as e:
            logger.error(f"Summarization failed: {e}")
            return {
                "summary": f"Summarization failed: {str(e)}",
                "key_points": [],
                "keywords": [],
            }

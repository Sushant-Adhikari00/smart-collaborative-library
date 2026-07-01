import requests
import logging

logger = logging.getLogger(__name__)


class LLMGenerator:
    """Generates answers and summaries using the Ollama LLM API."""

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "llama3.1",
        timeout: int = 120,
    ):
        self.model = model
        self.url = f"{base_url}/api/generate"
        self.timeout = timeout
        logger.info(f"LLM Generator initialized (model={model}, url={self.url})")

    def generate(self, question: str, context: str) -> str:
        """Generate an answer to a question using retrieved context."""
        prompt = (
            "You are a helpful and expert AI assistant. Use the following context to answer the question.\n"
            "If the context does not contain the information needed to answer the question, state politely that "
            "you cannot find the answer based on the provided documents. Do not make up facts or use outside knowledge.\n\n"
            f"Context:\n{context}\n\n"
            f"Question:\n{question}\n\n"
            "Answer clearly and accurately:"
        )
        return self._call_ollama(prompt)

    def summarize(self, text: str) -> dict:
        """
        Generate a summary, key points, and keywords from text.

        Returns:
            dict with keys: summary, key_points, keywords
        """
        # Truncate to avoid overwhelming the LLM context window
        max_chars = 6000
        truncated = text[:max_chars]

        prompt = (
            "You are an AI assistant. Analyze the following academic content and provide:\n\n"
            "1. **Summary**: A concise paragraph summarizing the content.\n"
            "2. **Key Points**: 3-5 bullet points of the most important ideas.\n"
            "3. **Keywords**: 5-10 relevant keywords separated by commas.\n\n"
            "Format your response EXACTLY as:\n"
            "SUMMARY:\n<your summary>\n\n"
            "KEY POINTS:\n- <point 1>\n- <point 2>\n...\n\n"
            "KEYWORDS:\n<keyword1>, <keyword2>, ...\n\n"
            f"Content:\n{truncated}"
        )

        raw = self._call_ollama(prompt)
        return self._parse_summary_response(raw)

    def _call_ollama(self, prompt: str) -> str:
        """Make a request to the Ollama API."""
        try:
            response = requests.post(
                self.url,
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()["response"]

        except requests.exceptions.ConnectionError:
            logger.error(f"Cannot connect to Ollama at {self.url}")
            raise ConnectionError(
                f"Ollama is not reachable at {self.url}. "
                "Please ensure Ollama is running with: ollama serve"
            )
        except requests.exceptions.Timeout:
            logger.error(f"Ollama request timed out after {self.timeout}s")
            raise TimeoutError(
                f"LLM request timed out after {self.timeout} seconds"
            )
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            raise

    def _parse_summary_response(self, raw: str) -> dict:
        """Parse the structured summary response from the LLM."""
        result = {
            "summary": "",
            "key_points": [],
            "keywords": [],
        }

        try:
            # Extract summary
            if "SUMMARY:" in raw:
                parts = raw.split("SUMMARY:", 1)[1]
                if "KEY POINTS:" in parts:
                    result["summary"] = parts.split("KEY POINTS:", 1)[0].strip()
                else:
                    result["summary"] = parts.strip()

            # Extract key points
            if "KEY POINTS:" in raw:
                parts = raw.split("KEY POINTS:", 1)[1]
                if "KEYWORDS:" in parts:
                    kp_section = parts.split("KEYWORDS:", 1)[0]
                else:
                    kp_section = parts
                points = [
                    line.strip().lstrip("- ").strip()
                    for line in kp_section.strip().splitlines()
                    if line.strip().startswith("-") or line.strip().startswith("•")
                ]
                result["key_points"] = points

            # Extract keywords
            if "KEYWORDS:" in raw:
                kw_section = raw.split("KEYWORDS:", 1)[1].strip()
                keywords = [
                    kw.strip()
                    for kw in kw_section.split(",")
                    if kw.strip()
                ]
                result["keywords"] = keywords

        except Exception as e:
            logger.warning(f"Failed to parse structured summary, using raw: {e}")
            result["summary"] = raw

        # Fallback if parsing yielded nothing
        if not result["summary"]:
            result["summary"] = raw

        return result
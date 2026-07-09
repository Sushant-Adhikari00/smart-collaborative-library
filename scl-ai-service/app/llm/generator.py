import logging
import requests

logger = logging.getLogger(__name__)


class LLMGenerator:
    """
    Generates answers and summaries using either:
      - Groq API (cloud, free) when GROQ_API_KEY is set  ← preferred
      - Ollama (local) as fallback when no API key is provided
    """

    def __init__(
        self,
        groq_api_key: str = "",
        groq_model: str = "llama-3.1-8b-instant",
        ollama_base_url: str = "http://localhost:11434",
        ollama_model: str = "llama3.1",
        timeout: int = 60,
    ):
        self.timeout = timeout
        self.groq_api_key = groq_api_key

        if groq_api_key:
            # Use Groq cloud API
            self._backend = "groq"
            self.model = groq_model
            self.url = "https://api.groq.com/openai/v1/chat/completions"
            logger.info(f"LLM Generator using Groq API (model={groq_model})")
        else:
            # Fall back to local Ollama
            self._backend = "ollama"
            self.model = ollama_model
            self.url = f"{ollama_base_url}/api/generate"
            logger.warning(
                "GROQ_API_KEY not set — falling back to local Ollama. "
                "Chat will fail if Ollama is not running locally."
            )

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
        return self._call_llm(prompt)

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

        raw = self._call_llm(prompt)
        return self._parse_summary_response(raw)

    def _call_llm(self, prompt: str) -> str:
        """Route to the correct backend — Groq or Ollama."""
        if self._backend == "groq":
            return self._call_groq(prompt)
        return self._call_ollama(prompt)

    def _call_groq(self, prompt: str) -> str:
        """Call the Groq cloud API (OpenAI-compatible format)."""
        try:
            response = requests.post(
                self.url,
                headers={
                    "Authorization": f"Bearer {self.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.3,
                    "max_tokens": 1024,
                },
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

        except requests.exceptions.ConnectionError:
            logger.error("Cannot connect to Groq API")
            raise ConnectionError(
                "Cannot reach Groq API. Check your internet connection."
            )
        except requests.exceptions.Timeout:
            logger.error(f"Groq API timed out after {self.timeout}s")
            raise TimeoutError(f"LLM request timed out after {self.timeout} seconds")
        except requests.exceptions.HTTPError as e:
            logger.error(f"Groq API HTTP error: {e.response.status_code} — {e.response.text}")
            raise
        except Exception as e:
            logger.error(f"Groq LLM call failed: {e}")
            raise

    def _call_ollama(self, prompt: str) -> str:
        """Call the local Ollama API."""
        try:
            response = requests.post(
                self.url,
                json={"model": self.model, "prompt": prompt, "stream": False},
                timeout=self.timeout,
            )
            response.raise_for_status()
            return response.json()["response"]

        except requests.exceptions.ConnectionError:
            logger.error(f"Cannot connect to Ollama at {self.url}")
            raise ConnectionError(
                f"Ollama is not reachable at {self.url}. "
                "Either set GROQ_API_KEY in .env or run: ollama serve"
            )
        except requests.exceptions.Timeout:
            logger.error(f"Ollama timed out after {self.timeout}s")
            raise TimeoutError(f"LLM request timed out after {self.timeout} seconds")
        except Exception as e:
            logger.error(f"Ollama LLM call failed: {e}")
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
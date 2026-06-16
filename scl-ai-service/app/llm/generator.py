import requests


class LLMGenerator:
    def __init__(self, model="llama3.1"):
        self.model = model
        self.url = "http://localhost:11434/api/generate"

    def generate(self, question, context):
        prompt = f"""
You are an AI assistant. Use ONLY the context below.

Context:
{context}

Question:
{question}

Answer clearly and concisely:
"""

        response = requests.post(
            self.url,
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False
            }
        )

        return response.json()["response"]
import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.processors.pdf import process_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import EmbeddingService
from app.vectorstore.faiss_store import FAISSVectorStore
from app.rag.retriever import Retriever
from app.llm.generator import LLMGenerator


def test_rag():

    result = process_pdf("Chapter1-MobApp.pdf")
    text = result["text"]
    cleaned = clean_text(text)
    chunks = chunk_text(cleaned)

    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)

    store = FAISSVectorStore(dimension=embedder.dimension)
    store.add_documents(chunks, embeddings)

    retriever = Retriever(store, embedder)
    llm = LLMGenerator(model="llama3.1")

    while True:
        question = input("\nAsk: ")

        docs = retriever.retrieve(question)

        context = "\n\n".join(docs)

        answer = llm.generate(question, context)

        print("\n🤖 ANSWER:\n")
        print(answer)


if __name__ == "__main__":
    test_rag()

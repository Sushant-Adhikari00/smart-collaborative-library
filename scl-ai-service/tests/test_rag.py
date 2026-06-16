import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.extractors.pdf_extractor import extract_text_from_pdf
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text
from app.embeddings.embedder import get_embeddings
from app.vectorstore.faiss_store import FAISSVectorStore
from app.rag.retriever import Retriever
from app.llm.generator import LLMGenerator


def test_rag():

    text = extract_text_from_pdf("Chapter1-MobApp.pdf")
    cleaned = clean_text(text)
    chunks = chunk_text(cleaned)

    embeddings = get_embeddings(chunks)

    store = FAISSVectorStore(len(embeddings[0]))
    store.add_documents(chunks, embeddings)

    retriever = Retriever(store)
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

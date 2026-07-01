"""
Tests for the SCL AI Service.

Updated to use the new modular architecture:
- app.processors.pdf replaces app.extractors.pdf_extractor
- app.processors.text_cleaner (enhanced)
- app.processors.text_chunker (enhanced)
- app.embeddings.embedder uses EmbeddingService class
- app.vectorstore.faiss_store uses enhanced FAISSVectorStore
- app.rag.retriever uses updated Retriever class
- app.llm.generator uses enhanced LLMGenerator
"""
import sys
import os

# Add project root to Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# ─────────────── Test 1: PDF Extraction ───────────────


def test_pdf_extraction():
    from app.processors.pdf import process_pdf

    result = process_pdf("Chapter1-MobApp.pdf")

    print("\n========== EXTRACTED TEXT ==========\n")
    print(result["text"][:2000])

    assert result["text"] is not None
    assert len(result["text"]) > 0
    assert result["type"] == "pdf"
    print("\n[PASS] PDF extraction test passed!")


# ─────────────── Test 2: Text Cleaning & Chunking ───────────────


def test_chunking():
    from app.processors.pdf import process_pdf
    from app.processors.text_cleaner import clean_text
    from app.processors.text_chunker import chunk_text

    result = process_pdf("Chapter1-MobApp.pdf")
    cleaned = clean_text(result["text"])
    chunks = chunk_text(cleaned)

    print(f"\nTotal Chunks: {len(chunks)}\n")

    for i, chunk in enumerate(chunks[:3]):
        print(f"\nChunk {i+1}\n")
        print(chunk)
        print("-" * 50)

    assert len(chunks) > 0
    print("\n[PASS] Chunking test passed!")


# ─────────────── Test 3: Embeddings ───────────────


def test_embeddings():
    from app.processors.pdf import process_pdf
    from app.processors.text_cleaner import clean_text
    from app.processors.text_chunker import chunk_text
    from app.embeddings.embedder import EmbeddingService

    result = process_pdf("Chapter1-MobApp.pdf")
    cleaned = clean_text(result["text"])
    chunks = chunk_text(cleaned)

    embedder = EmbeddingService()
    vectors = embedder.embed(chunks)

    print("\nTotal Chunks:", len(chunks))
    print("Embedding Shape:", vectors.shape)
    print("Dimension:", embedder.dimension)

    assert len(vectors) == len(chunks)
    print("\n[PASS] Embeddings test passed!")


# ─────────────── Test 4: FAISS Store ───────────────


def test_faiss():
    from app.processors.pdf import process_pdf
    from app.processors.text_cleaner import clean_text
    from app.processors.text_chunker import chunk_text
    from app.embeddings.embedder import EmbeddingService
    from app.vectorstore.faiss_store import FAISSVectorStore

    result = process_pdf("Chapter1-MobApp.pdf")
    cleaned = clean_text(result["text"])
    chunks = chunk_text(cleaned)

    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)

    store = FAISSVectorStore(dimension=embedder.dimension)
    store.add_documents(chunks, embeddings)

    results = store.search(embeddings[0], top_k=3)

    print(f"\nTOP RESULTS (store has {store.document_count} docs):\n")
    for r in results:
        print("-", r[:200], "\n")

    assert len(results) > 0
    print("\n[PASS] FAISS test passed!")


# ─────────────── Test 5: Retriever ───────────────


def test_retriever():
    from app.processors.pdf import process_pdf
    from app.processors.text_cleaner import clean_text
    from app.processors.text_chunker import chunk_text
    from app.embeddings.embedder import EmbeddingService
    from app.vectorstore.faiss_store import FAISSVectorStore
    from app.rag.retriever import Retriever

    result = process_pdf("Chapter1-MobApp.pdf")
    cleaned = clean_text(result["text"])
    chunks = chunk_text(cleaned)

    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)

    store = FAISSVectorStore(dimension=embedder.dimension)
    store.add_documents(chunks, embeddings)

    retriever = Retriever(store, embedder)

    question = "What is mobile application development?"
    results = retriever.retrieve(question, top_k=3)

    print(f"\n===== RETRIEVED CHUNKS for: '{question}' =====\n")
    for i, chunk in enumerate(results, start=1):
        print(f"\nChunk {i}:\n")
        print(chunk[:500])

    assert len(results) > 0
    print("\n[PASS] Retriever test passed!")


# ─────────────── Test 6: Full RAG Pipeline ───────────────


def test_rag():
    from app.processors.pdf import process_pdf
    from app.processors.text_cleaner import clean_text
    from app.processors.text_chunker import chunk_text
    from app.embeddings.embedder import EmbeddingService
    from app.vectorstore.faiss_store import FAISSVectorStore
    from app.rag.retriever import Retriever
    from app.llm.generator import LLMGenerator

    result = process_pdf("Chapter1-MobApp.pdf")
    cleaned = clean_text(result["text"])
    chunks = chunk_text(cleaned)

    embedder = EmbeddingService()
    embeddings = embedder.embed(chunks)

    store = FAISSVectorStore(dimension=embedder.dimension)
    store.add_documents(chunks, embeddings)

    retriever = Retriever(store, embedder)
    llm = LLMGenerator()

    question = "What is mobile application development?"
    docs = retriever.retrieve(question, top_k=3)
    context = "\n\n".join(docs)
    answer = llm.generate(question, context)

    print("\nANSWER:\n")
    print(answer)

    assert answer is not None
    print("\n[PASS] Full RAG test passed!")


# ─────────────── Run All ───────────────

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--test", choices=["pdf", "chunk", "embed", "faiss", "retriever", "rag", "all"], default="all")
    args = parser.parse_args()

    tests = {
        "pdf": test_pdf_extraction,
        "chunk": test_chunking,
        "embed": test_embeddings,
        "faiss": test_faiss,
        "retriever": test_retriever,
        "rag": test_rag,
    }

    if args.test == "all":
        for name, fn in tests.items():
            print(f"\n{'='*60}")
            print(f"Running: {name}")
            print(f"{'='*60}")
            fn()
    else:
        tests[args.test]()

    print("\nAll selected tests passed!")

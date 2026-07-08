# SCL AI Service

AI-powered microservice for the **Smart Collaborative Learning (SCL)** platform.

Built with FastAPI, this service processes academic content (documents, images, videos) into AI-searchable knowledge using embeddings, FAISS vector search, and RAG-based question answering.

## Features

- **Multi-format file processing** — PDF, DOCX, TXT, CSV, XLSX
- **Image OCR** — PNG, JPG, JPEG (via EasyOCR)
- **Video transcription** — MP4, MOV, AVI (via OpenAI Whisper)
- **Text cleaning & chunking** — noise removal, overlapping chunks
- **Embedding generation** — SentenceTransformers (`all-MiniLM-L6-v2`)
- **FAISS vector database** — semantic similarity search with disk persistence
- **RAG pipeline** — retrieval-augmented generation for Q&A
- **AI summarization** — summary, key points, keywords extraction
- **LLM integration** — Ollama with `llama3.1`

## Prerequisites

- Python 3.10+
- [Ollama](https://ollama.ai/) running locally with `llama3.1` pulled:
  ```bash
  ollama pull llama3.1
  ollama serve
  ```

## Setup

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --reload --port 8000
```

## API Endpoints

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/health`      | Service health status                |
| POST   | `/ai/process`  | Upload & process a file              |
| POST   | `/ai/chat`     | Ask a question (RAG-based Q&A)       |

### POST /ai/process
```bash
curl -X POST -F "file=@document.pdf" http://localhost:8000/ai/process
```

### POST /ai/chat
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"question": "Explain normalization"}' \
  http://localhost:8000/ai/chat
```

## Architecture

```
Input File → File Router → Processor → Text Cleaner → Chunker
→ Embedding Generator → FAISS Store → Retriever → LLM → AI Output
```

## Project Structure

```
app/
├── main.py                 # FastAPI app factory + lifespan
├── config.py               # Centralized settings
├── api/routes.py           # API endpoints
├── services/               # Business logic
│   ├── file_router.py      # Extension-based routing
│   ├── document_service.py # Full pipeline orchestrator
│   └── summary_service.py  # LLM summarization
├── processors/             # Format-specific extractors
│   ├── pdf.py, docx.py, txt.py, csv_processor.py, xlsx.py
│   ├── image.py (OCR), video.py (Whisper)
│   ├── text_cleaner.py, text_chunker.py
├── embeddings/embedder.py  # SentenceTransformer service
├── vectorstore/faiss_store.py  # FAISS with persistence
├── rag/retriever.py        # Semantic search retriever
└── llm/generator.py        # Ollama LLM client
```

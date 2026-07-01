# SCL AI Service — Project & API Documentation

The **SCL AI Service** is a high-performance, modular AI microservice built with **FastAPI** for the Smart Collaborative Learning (SCL) platform. It processes multi-format educational content (documents, images, videos) and structures it for semantic search and Retrieval-Augmented Generation (RAG) using local LLMs.

---

## 🏗️ System Architecture

The service consists of two main pipelines: **Ingestion** and **Retrieval / Q&A**.

### 1. Document Ingestion Pipeline
```
Upload File ──> File Router ──> Processor (PDF/DOCX/TXT/CSV/XLSX/OCR/Whisper)
                                      │
                                      ▼
                                Text Cleaner
                                      │
                                      ▼
                             Text Chunker (Whitespace-Aware)
                                      │
                                      ▼
                            Embedding Service (SentenceTransformers)
                                      │
                                      ▼
                            FAISS Vector Database (With Persistence)
```

### 2. Retrieval & Q&A Pipeline (RAG)
```
User Query ──> Embedding Service ──> Semantic Search (FAISS) ──> Relevant Context Chunks
                                                                           │
                                                                           ▼
User Query + Context ──────────────────────────────────────────────> LLM (Ollama / Llama 3.1)
                                                                           │
                                                                           ▼
                                                                  AI Response + Sources
```

---

## 📁 Project Structure

```
scl-ai-service/
├── app/
│   ├── main.py                 # FastAPI App Factory & service lifespans
│   ├── config.py               # Pydantic-settings config (.env loader)
│   ├── api/
│   │   └── routes.py           # Endpoint definitions (Health, Process, Chat)
│   ├── embeddings/
│   │   └── embedder.py         # Embedding generation wrapper
│   ├── llm/
│   │   └── generator.py        # Ollama LLM response wrapper & prompt engineering
│   ├── processors/             # Specialized text extractors
│   │   ├── csv_processor.py    # CSV processing
│   │   ├── docx.py             # Word document parsing
│   │   ├── image.py            # OCR image processing (via EasyOCR)
│   │   ├── pdf.py              # PDF extraction (via PyMuPDF)
│   │   ├── text_chunker.py     # Whitespace-aware text splitting
│   │   ├── text_cleaner.py     # Text cleaning & unicode normalization
│   │   ├── txt.py              # Plain text loader
│   │   ├── video.py            # Video audio transcription (via OpenAI Whisper)
│   │   └── xlsx.py             # Excel sheet parser
│   ├── rag/
│   │   └── retriever.py        # Semantic Search context generator
│   └── services/
│       ├── document_service.py # Orchestrates full ingestion process
│       ├── file_router.py      # Category-based router for uploaded formats
│       └── summary_service.py  # Structured summarization orchestrator
├── docs/
│   ├── project_documentation.md  # Historic step-by-step documentation
│   └── project_documentationa.md # [This File] Complete developer documentation
├── faiss_data/                 # Directory where the FAISS index is persisted
├── tests/                      # Automated unit & integration tests
│   ├── test_chunking.py        # Test for whitespace-aware chunker
│   ├── test_embeddings.py      # Test for embedding generation
│   ├── test_faiss.py           # Test for FAISS storage and retrieval
│   ├── test_pdf.py             # Test for PDF processing
│   ├── test_pipeline.py        # Complete integration test runner
│   ├── test_rag.py             # Interactive terminal playground
│   └── test_retriever.py       # Test for query-matching relevance
├── uploads/                    # Temporary folder for uploads
├── requirements.txt            # Python dependency specification
└── .env.example                # Example configuration parameters
```

---

## 🧩 Core Service Modules

### 1. File Router (`app/services/file_router.py`)
Routes files by extension to their appropriate parsing processor. Supports:
* **Documents:** `.pdf`, `.docx`, `.txt`, `.csv`, `.xlsx`
* **Images (OCR):** `.png`, `.jpg`, `.jpeg` (via EasyOCR)
* **Videos (Transcription):** `.mp4`, `.mov`, `.avi` (via OpenAI Whisper base model)

### 2. Whitespace-Aware Chunker (`app/processors/text_chunker.py`)
Divides cleaned text into overlapping segments. Rather than hard-slicing at character indexes (which breaks words in half), it scans backwards up to the overlap length to locate a space boundary, preserving terms intact.

### 3. Embedding Service (`app/embeddings/embedder.py`)
Utilizes HuggingFace SentenceTransformers (`all-MiniLM-L6-v2` by default) to generate dense 384-dimensional floating-point vectors representing semantic meaning.

### 4. FAISS Vector database (`app/vectorstore/faiss_store.py`)
A wrapper around Facebook AI Similarity Search (FAISS) utilizing Euclidean distance (L2) indexing. Persists the index to disk under the directory specified by `FAISS_INDEX_DIR`.

### 5. LLM Client & Prompt Optimizer (`app/llm/generator.py`)
Interacts with local Ollama instances (running `llama3.1` by default). Includes refined safety guidelines that prevent hallucinations by instructing the model to reply politely that it cannot find the answer if the context does not contain the necessary information.

---

## 🌐 API Endpoints Specification

### 1. Health Status
Check the current health of the microservice and check how many document chunks are currently indexed.

* **Method:** `GET`
* **Path:** `/health`
* **Response Body (`application/json`):**
  ```json
  {
    "status": "healthy",
    "service": "scl-ai-service",
    "documents_indexed": 71
  }
  ```

### 2. Process Uploaded File
Ingests and indexes a file. Extracting text, generating an AI summary, chunking, and storing vector embeddings in the FAISS index.

* **Method:** `POST`
* **Path:** `/ai/process`
* **Request Body:** `multipart/form-data`
  * `file`: Binary file (PDF, Word, TXT, Excel, CSV, Image, or Video)
* **Response Body (`application/json`):**
  ```json
  {
    "text": "Extracted text content...",
    "summary": {
      "summary": "AI generated paragraph summarizing the file.",
      "key_points": [
        "Point 1",
        "Point 2"
      ],
      "keywords": ["keyword1", "keyword2"]
    },
    "type": "document",
    "chunks_count": 12
  }
  ```

### 3. Q&A Chat (RAG)
Allows users to ask questions against the uploaded and indexed documents.

* **Method:** `POST`
* **Path:** `/ai/chat`
* **Request Body (`application/json`):**
  ```json
  {
    "question": "What is mobile application development?"
  }
  ```
* **Response Body (`application/json`):**
  ```json
  {
    "answer": "AI generated response utilizing ONLY the context retrieved from documents...",
    "sources": [
      "Retrieved document chunk 1 context used...",
      "Retrieved document chunk 2 context used..."
    ]
  }
  ```

---

## ⚙️ Running and Testing the Service

### Setup
1. Verify **Ollama** is running locally and model is available:
   ```bash
   ollama pull llama3.1
   ollama serve
   ```
2. Navigate to the folder, activate environment, and start backend:
   ```powershell
   cd scl-ai-service
   venv\Scripts\activate
   uvicorn app.main:app --reload --port 8000
   ```

### Running Tests
Execute the comprehensive test pipeline to check all processing steps:
```powershell
python tests/test_pipeline.py --test all
```
Or use the interactive terminal tool to ask questions directly in shell:
```powershell
python tests/test_rag.py
```

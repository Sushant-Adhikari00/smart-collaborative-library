# Smart Collaborative Library (SCL) - AI Service Documentation & Guide

## 1. Overview & Tech Stack
The **AI Service Module** (`scl-ai-service`) is a Python microservice built with **FastAPI** that powers intelligent capabilities across the platform. It handles document parsing, optical character recognition (OCR), text chunking, vector embedding generation, vector similarity retrieval (RAG), and LLM text generation/summarization using Groq or Ollama.

### **Core Technologies & Libraries**
- **Framework**: FastAPI + Uvicorn (Asynchronous Python Web Server)
- **Vector Database**: FAISS (`faiss-cpu`) / Supabase Vector (Stores vector embeddings locally or in cloud)
- **Embedding Model**: `sentence-transformers` (`all-MiniLM-L6-v2` / PyTorch)
- **LLM Generators**: Groq API (Cloud fast inference via Llama 3) or Ollama (Local LLM runner)
- **Document Extractors & Processors**:
  - PDF: `pypdf` / `pdfplumber` / `pdf2image`
  - Word Docs: `python-docx`
  - Spreadsheets: `pandas` + `openpyxl`
  - Images & OCR: `pytesseract` + `Pillow`
  - Audio/Video: `whisper` / `ffmpeg`
- **Validation**: `pydantic` v2

---

## 2. Directory & File Mapping

Below is the detailed breakdown of every single file in the AI Service project and its specific responsibility.

### **Root & Setup Files**
- [requirements.txt](file:///c:/final_year_project/scl-ai-service/requirements.txt): Python dependencies list including `fastapi`, `uvicorn`, `faiss-cpu`, `sentence-transformers`, `groq`, `pydantic`, `pypdf`, `python-docx`, `pytesseract`, `pandas`.
- [.env / .env.example](file:///c:/final_year_project/scl-ai-service/.env.example): Configuration file storing environment variables (`GROQ_API_KEY`, `OLLAMA_BASE_URL`, `EMBEDDING_MODEL`, `FAISS_INDEX_DIR`, `CHUNK_SIZE`).
- [Dockerfile](file:///c:/final_year_project/scl-ai-service/Dockerfile): Docker build blueprint for containerized AI service environment.
- [docker-compose.yml](file:///c:/final_year_project/scl-ai-service/docker-compose.yml): Services composition setup.

---

### **Core Application Package (`app/`)**

- [app/main.py](file:///c:/final_year_project/scl-ai-service/app/main.py): Service entry point initializing the FastAPI app instance. Implements a lifespan context manager (`@asynccontextmanager`) that pre-loads models at startup:
  1. `EmbeddingService` (`all-MiniLM-L6-v2`)
  2. `FAISSVectorStore` (persisted on disk in `faiss_data/`)
  3. `Retriever`
  4. `LLMGenerator` (Groq/Ollama)
  5. `SummaryService` & `DocumentService`

- [app/config.py](file:///c:/final_year_project/scl-ai-service/app/config.py): Pydantic-based settings manager reading runtime configurations from `.env`.

---

### **API Routing & Handlers (`app/api/`)**
- [app/api/routes.py](file:///c:/final_year_project/scl-ai-service/app/api/routes.py): FastAPI endpoints definition:
  - `GET /health`: Health check returning document counts indexed in FAISS.
  - `POST /ai/process`: Upload file endpoint (PDF, DOCX, CSV, XLSX, Images, Videos). Extracts text, chunks content, indexes vectors in FAISS, and returns AI summary + keywords.
  - `POST /ai/process-url`: Downloads file from remote URL (e.g. Supabase storage) and processes through AI pipeline.
  - `POST /ai/chat`: RAG endpoint for single document Q&A (retrieves relevant chunks from FAISS index and passes context to LLM).
  - `POST /ai/chat-multi`: Workspace RAG endpoint for querying across multiple documents simultaneously (used in study group shared AI tab).

---

### **Extractors & Processors (`app/processors/`)**
- [app/processors/text_cleaner.py](file:///c:/final_year_project/scl-ai-service/app/processors/text_cleaner.py): Normalizes whitespace, removes control characters, and cleans raw text extracted from documents.
- [app/processors/text_chunker.py](file:///c:/final_year_project/scl-ai-service/app/processors/text_chunker.py): Splits long text into overlapping chunks (`chunk_size=500`, `chunk_overlap=50`) preserving semantic context for vector embedding.
- [app/processors/pdf.py](file:///c:/final_year_project/scl-ai-service/app/processors/pdf.py): Extracts text content from PDF pages using PyPDF/pdfplumber.
- [app/processors/docx.py](file:///c:/final_year_project/scl-ai-service/app/processors/docx.py): Extracts text and paragraphs from `.docx` files using `python-docx`.
- [app/processors/txt.py](file:///c:/final_year_project/scl-ai-service/app/processors/txt.py): Reads plain text and markdown documents.
- [app/processors/csv_processor.py](file:///c:/final_year_project/scl-ai-service/app/processors/csv_processor.py): Converts CSV rows and structured data into textual summaries.
- [app/processors/xlsx.py](file:///c:/final_year_project/scl-ai-service/app/processors/xlsx.py): Extracts cell data across Excel worksheets.
- [app/processors/image.py](file:///c:/final_year_project/scl-ai-service/app/processors/image.py): Runs OCR on images (PNG, JPG) using Tesseract.
- [app/processors/audio.py](file:///c:/final_year_project/scl-ai-service/app/processors/audio.py): Transcribes audio files (MP3, WAV) using OpenAI Whisper.
- [app/processors/video.py](file:///c:/final_year_project/scl-ai-service/app/processors/video.py): Extracts audio track from video files (MP4) and runs speech-to-text transcription.

---

### **Embeddings & Vector Store (`app/embeddings/` & `app/vectorstore/`)**
- [app/embeddings/embedder.py](file:///c:/final_year_project/scl-ai-service/app/embeddings/embedder.py): Encodes text strings into 384-dimensional dense vector embeddings using SentenceTransformers.
- [app/vectorstore/faiss_store.py](file:///c:/final_year_project/scl-ai-service/app/vectorstore/faiss_store.py): Implements FAISS CPU index with persistence on disk (`faiss_data/index.faiss` and `metadata.json`). Stores doc chunks mapped to document IDs for metadata filtering.
- [app/vectorstore/supabase_store.py](file:///c:/final_year_project/scl-ai-service/app/vectorstore/supabase_store.py): Alternative vector store provider using Supabase pgvector.

---

### **RAG & LLM Engine (`app/rag/`, `app/llm/`, `app/services/`)**
- [app/rag/retriever.py](file:///c:/final_year_project/scl-ai-service/app/rag/retriever.py): Encodes user questions into vectors and queries FAISS to retrieve top-k most similar document chunks.
- [app/llm/generator.py](file:///c:/final_year_project/scl-ai-service/app/llm/generator.py): Formats prompts with retrieved context chunks and invokes Groq API or Ollama model to generate accurate answers.
- [app/services/summary_service.py](file:///c:/final_year_project/scl-ai-service/app/services/summary_service.py): Prompts LLM to generate document executive summaries, key takeaways, and relevant study keywords.
- [app/services/document_service.py](file:///c:/final_year_project/scl-ai-service/app/services/document_service.py): Orchestrates the complete pipeline: File ingestion -> Extraction -> Text Cleaning -> Chunking -> Vector Indexing -> Summary Generation.
- [app/services/file_router.py](file:///c:/final_year_project/scl-ai-service/app/services/file_router.py): Maps file extension extensions (`.pdf`, `.docx`, `.png`, etc.) to their respective extractor processor.

---

## 3. Complete AI Processing Workflow
1. **Document Processing Workflow**:
   Backend sends file to `POST /ai/process` -> `file_router.py` selects processor -> `pdf.py`/`docx.py`/`image.py` extracts text -> `text_cleaner.py` cleans text -> `text_chunker.py` creates chunks -> `embedder.py` generates vector embeddings -> `faiss_store.py` indexes vectors -> `summary_service.py` calls LLM to output summary & key points -> Response sent back to Spring Boot.
2. **Retrieval-Augmented Generation (RAG) Q&A Workflow**:
   User sends question -> `POST /ai/chat` (or `/ai/chat-multi`) -> `retriever.py` searches FAISS for top-k matching document chunks -> `generator.py` constructs prompt with context + question -> Groq/Ollama LLM generates final response -> Response returned with cited source snippets.

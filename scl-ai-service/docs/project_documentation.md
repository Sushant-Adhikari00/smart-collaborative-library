# 📘 SCL AI SERVICE — PROJECT DOCUMENTATION

## Version: v0.1 (Step 1 Complete)

---

# 🧠 1. Project Overview

This project is an AI-powered document intelligence system designed to process, understand, and interact with documents such as PDFs using AI techniques (RAG in future steps).

---

# 📌 2. Completed Feature (Step 1)

## 📄 PDF Text Extraction System

### 🎯 Objective:
Convert PDF files into raw text so that they can be used in AI processing pipelines.

---

## 🏗️ System Architecture

PDF File  
↓  
PyMuPDF (fitz)  
↓  
pdf_extractor.py  
↓  
test_pdf.py  
↓  
Extracted Text Output  

---

# 📁 3. Current Project Structure

scl-ai-service/
│
├── app/
│   └── extractors/
│       ├── pdf_extractor.py
│       └── test_pdf.py
│
├── sample.pdf
├── venv/
├── requirements.txt
└── docs/
    └── project_documentation.md

---

# ⚙️ 4. Technologies Used

- Python
- PyMuPDF (fitz)
- Virtual Environment (venv)

---

# 🧩 5. Module Explanation

## pdf_extractor.py
- Core logic file
- Extracts text from PDF files
- Uses PyMuPDF for fast and reliable parsing

## test_pdf.py
- Test file to validate extractor
- Loads a sample PDF
- Prints extracted text

---

# 🔄 6. Data Flow

1. User provides PDF file  
2. PyMuPDF opens the file  
3. Each page is read  
4. Text is extracted  
5. Combined text is returned  

---

# 🧠 7. Key Learnings

- PDFs cannot be directly used in AI systems
- Text extraction is the first step in AI document understanding
- Separation of logic and testing improves code quality
- Virtual environments prevent dependency conflicts

---

# 🚨 8. Issues Faced & Fixes

| Issue | Reason | Fix |
|------|--------|-----|
| ModuleNotFoundError (fitz) | PyMuPDF not installed | pip install pymupdf |
| File not found | Wrong path | Correct project directory |
| PdfReader error | Mixed libraries | Standardized to PyMuPDF |

---

# ✅ 9. Current Status

✔ PDF extraction working  
✔ Environment stable  
✔ Code modular and reusable  
✔ Ready for AI processing pipeline  

---

# ⛔ 10. Not Yet Implemented

- Text chunking
- Embeddings
- Vector database
- RAG system
- AI chatbot

---

# 🚀 11. Next Step Preview

## Step 2: Text Processing Layer

We will:
- Split extracted text into chunks
- Clean and normalize text
- Prepare data for embeddings
- Build foundation for RAG system

<<<<<<< HEAD

# 📘 SCL AI SERVICE — PROJECT DOCUMENTATION

## Version: v0.2 (Text Processing Layer Complete)

---

# 🧠 1. Overview

In this step, the system evolved from simple PDF text extraction into a **structured text processing pipeline**. The goal was to prepare raw extracted text for AI usage by cleaning and splitting it into meaningful chunks.

This is a crucial step before embeddings and RAG (Retrieval-Augmented Generation).

---

# 📌 2. Completed Feature (Step 2)

## 🧩 Text Processing Layer

### 🎯 Objective:

Transform raw extracted PDF text into **clean, structured, AI-ready chunks**.

---

# 🏗️ 3. System Architecture (Step 2)

```text id="arch1"
PDF File
   ↓
Text Extraction (PyMuPDF)
   ↓
Raw Text
   ↓
Text Cleaning (Regex normalization)
   ↓
Clean Text
   ↓
Text Chunking (Sliding Window)
   ↓
Structured Chunks
```

---

# 📁 4. New Modules Introduced

## 🧹 text_cleaner.py

### Purpose:

Clean raw extracted text from PDFs.

### Responsibilities:

* Remove extra spaces
* Normalize whitespace
* Strip unnecessary characters

### Core Function:

```python id="c1"
def clean_text(text: str) -> str
```

---

## ✂️ text_chunker.py

### Purpose:

Split large text into smaller overlapping chunks.

### Responsibilities:

* Divide text into fixed-size segments
* Maintain context using overlap
* Prepare text for embeddings

### Core Function:

```python id="c2"
def chunk_text(text: str, chunk_size=500, overlap=100)
```

---

# 🔄 5. Data Flow (Step 2)

```text id="flow1"
Raw PDF Text
   ↓
Cleaning (remove noise, normalize spaces)
   ↓
Chunking (split into manageable pieces)
   ↓
AI-ready text segments
```

---

# ⚙️ 6. Key Concepts Introduced

## 🧼 Text Cleaning

Raw PDF text often contains:

* Extra spaces
* Broken lines
* Formatting noise

Cleaning ensures uniform text structure.

---

## ✂️ Chunking

Large documents are split into smaller parts:

### Why?

* AI models cannot process very large text efficiently
* Chunking improves retrieval accuracy
* Enables scalable search systems

---

## 🔁 Overlapping Strategy

Chunks overlap slightly to preserve meaning:

Example:

```
Chunk 1: "machine learning is a subset of..."
Chunk 2: "...a subset of artificial intelligence"
```

This prevents loss of context.

---

# 📊 7. Chunking Strategy Used

| Parameter  | Value          |
| ---------- | -------------- |
| Chunk Size | 500 characters |
| Overlap    | 100 characters |

---

# 🧠 8. Key Learnings

* Raw extracted text is noisy and unstructured
* Cleaning improves consistency for downstream AI tasks
* Chunking is essential for semantic search and embeddings
* Overlap improves contextual understanding
* Modular pipeline design improves scalability

---

# 🚨 9. Issues Faced & Fixes

| Issue               | Cause                 | Fix                           |
| ------------------- | --------------------- | ----------------------------- |
| Import errors       | Wrong module paths    | Fixed package structure       |
| Overlap bug         | Typo in variable name | Corrected `overlap`           |
| Chunk inconsistency | No overlap strategy   | Added sliding window approach |

---

# ✅ 10. Current Status

✔ PDF extraction working
✔ Text cleaning implemented
✔ Chunking system functional
✔ Data ready for embedding generation

---

# ⛔ 11. Not Yet Implemented

* Embeddings generation
* Vector database
* Semantic search
* RAG system
* AI chatbot layer

---

# 🚀 12. Next Step Preview (Step 3)

## 🧠 Embeddings Layer

We will convert text chunks into numerical vectors so that AI can understand meaning and similarity between texts.

This enables:

* Semantic search
* AI-powered retrieval
* Chat with documents

---


# 📘 SCL AI SERVICE — PROJECT DOCUMENTATION

## Version: v0.3 (Embeddings Layer Complete)

---

# 🧠 1. Project Overview

This project is an AI-powered document intelligence system that processes PDF files and prepares them for Retrieval-Augmented Generation (RAG). The system progressively transforms raw documents into AI-understandable representations.

---

# 📌 2. Completed Features

## 📄 Step 1: PDF Extraction System

## 🧩 Step 2: Text Processing Layer

## 🧠 Step 3: Embeddings Layer (NEW)

---

# 🏗️ 3. System Architecture (Current)

```text id="arch1"
PDF File
   ↓
PyMuPDF (fitz)
   ↓
Text Extraction (pdf_extractor.py)
   ↓
Text Cleaning (text_cleaner.py)
   ↓
Chunking (text_chunker.py)
   ↓
Embeddings Model (SentenceTransformers)
   ↓
Vector Representations (Numerical Data)
```

---

# 📁 4. Current Project Structure

```text id="struct1"
scl-ai-service/
│
├── app/
│   ├── extractors/
│   │   ├── pdf_extractor.py
│   │   └── __init__.py
│   │
│   ├── processors/
│   │   ├── text_cleaner.py
│   │   ├── text_chunker.py
│   │   └── __init__.py
│   │
│   ├── embeddings/
│   │   ├── embedder.py
│   │   └── __init__.py
│
├── tests/
│   ├── test_pdf.py
│   ├── test_chunking.py
│   └── test_embeddings.py
│
├── sample.pdf
├── venv/
├── requirements.txt
└── docs/
    └── project_documentation.md
```

---

# ⚙️ 5. Technologies Used

| Component        | Technology                              |
| ---------------- | --------------------------------------- |
| Backend Language | Python                                  |
| PDF Processing   | PyMuPDF (fitz)                          |
| Text Cleaning    | Regex                                   |
| Chunking         | Custom Sliding Window                   |
| Embeddings       | SentenceTransformers (all-MiniLM-L6-v2) |
| Environment      | venv                                    |

---

# 🧩 6. Module Breakdown

## 📄 pdf_extractor.py

* Extracts raw text from PDF files
* Reads page-by-page using PyMuPDF

---

## 🧹 text_cleaner.py

* Removes extra spaces
* Normalizes raw extracted text
* Prepares text for processing

---

## ✂️ text_chunker.py

* Splits text into smaller overlapping chunks
* Prevents loss of context between chunks
* Uses sliding window approach

---

## 🧠 embedder.py

* Converts text chunks into vector embeddings
* Uses pre-trained transformer model
* Produces semantic representations of text

---

# 🔄 7. Full Data Flow

```text id="flow2"
1. PDF Input
      ↓
2. Text Extraction (PyMuPDF)
      ↓
3. Text Cleaning
      ↓
4. Chunking (500 chars, overlap 100)
      ↓
5. Embedding Generation
      ↓
6. Vector Representations (AI-ready data)
```

---

# 🧠 8. Key Learnings

### Step 1

* PDFs cannot be directly processed by AI

### Step 2

* Text must be cleaned and chunked for better AI understanding

### Step 3

* AI does not understand text directly — it understands **embeddings (vectors)**

### Important Concepts Learned:

* Data preprocessing is critical for AI systems
* Chunking improves retrieval accuracy
* Embeddings enable semantic search
* Modular architecture improves scalability

---

# 🚨 9. Issues Faced & Fixes

| Issue                    | Cause                      | Fix                     |
| ------------------------ | -------------------------- | ----------------------- |
| fitz ModuleNotFoundError | PyMuPDF not installed      | pip install pymupdf     |
| Import errors            | Wrong module paths         | Fixed package structure |
| overlapgit error         | Typo in chunking logic     | Corrected variable name |
| HuggingFace warnings     | Windows symlink limitation | Ignored (non-critical)  |

---

# ✅ 10. Current Status

✔ PDF extraction working
✔ Text cleaning stable
✔ Chunking functional
✔ Embeddings successfully generated
✔ AI preprocessing pipeline complete

---

# ⛔ 11. Not Yet Implemented

* Vector database (ChromaDB / FAISS)
* Semantic search system
* RAG retrieval pipeline
* AI chatbot layer
* FastAPI integration

---

# 🚀 12. Next Step Preview (Step 4)

## 🧠 Vector Database Layer (ChromaDB)

We will:

* Store embeddings
* Enable semantic search
* Retrieve relevant chunks based on user queries

This will transform the system into:

> 🔥 "Chat with your PDF system"

---


=======
# Version: v0.2 (Step 2 Complete)

## Text Processing Layer

### Features Added
- Text cleaning
- Text normalization
- Chunk generation
- Overlapping chunk strategy

### New Modules
- text_cleaner.py
- text_chunker.py

### Pipeline

PDF
↓
Extract Text
↓
Clean Text
↓
Chunk Text
↓
AI-Ready Chunks

### Purpose

Prepare extracted document text for:
- Embeddings
- Vector databases
- Retrieval-Augmented Generation (RAG)
>>>>>>> origin/development

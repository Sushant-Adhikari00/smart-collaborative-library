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
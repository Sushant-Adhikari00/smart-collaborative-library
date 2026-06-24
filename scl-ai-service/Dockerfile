# Use official lightweight Python image
FROM python:3.10-slim

# Set working directory in container
WORKDIR /app

# Install system dependencies required for:
# - EasyOCR / OpenCV (libgl1, libglib2.0)
# - Whisper Audio Extraction (ffmpeg)
# - Build tools (build-essential)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency definition
COPY requirements.txt .

# Install python packages
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the SentenceTransformer model during the build stage
# This makes container startup instantaneous and allows it to run offline
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Copy application files
COPY app/ ./app
COPY Chapter1-MobApp.pdf .

# Create volume folders for persistent FAISS indexing and temporary uploads
RUN mkdir -p faiss_data uploads

# Expose port
EXPOSE 8000

ENV PYTHONUNBUFFERED=1
ENV HOST=0.0.0.0
ENV PORT=8000

# Start server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

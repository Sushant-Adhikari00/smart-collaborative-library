import os
import uuid
import logging

from app.services.file_router import route_file, get_file_type_category
from app.processors.text_cleaner import clean_text
from app.processors.text_chunker import chunk_text

logger = logging.getLogger(__name__)


class DocumentService:
    """
    Orchestrates the full document processing pipeline:
    upload → extract → clean → chunk → embed → store → summarize.
    """

    def __init__(
        self,
        embedding_service,
        vector_store,
        summary_service,
        upload_dir: str = "uploads",
        chunk_size: int = 500,
        chunk_overlap: int = 100,
    ):
        self.embedding_service = embedding_service
        self.vector_store = vector_store
        self.summary_service = summary_service
        self.upload_dir = upload_dir
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

        # Ensure upload directory exists
        os.makedirs(self.upload_dir, exist_ok=True)

    async def process_upload(self, file, document_id: str) -> dict:
        """
        Process an uploaded file through the full pipeline.

        Args:
            file: FastAPI UploadFile object.
            document_id: Unique identifier for the document to scope FAISS index.

        Returns:
            dict with keys: text, summary, type, chunks_count
        """
        file_path = None
        try:
            # 1. Save uploaded file to disk
            file_path = await self._save_file(file)
            logger.info(f"Saved uploaded file: {file_path}")

            # 2. Get file category for response
            _, ext = os.path.splitext(file.filename)
            file_category = get_file_type_category(ext)

            # 3. Route to correct processor and extract text
            result = route_file(file_path)
            raw_text = result["text"]
            logger.info(
                f"Extracted {len(raw_text)} characters (type={result['type']})"
            )

            # 4. Clean text
            cleaned_text = clean_text(raw_text)
            logger.info(f"Cleaned text: {len(cleaned_text)} characters")

            # 5. Chunk text
            chunks = chunk_text(
                cleaned_text,
                chunk_size=self.chunk_size,
                overlap=self.chunk_overlap,
            )
            logger.info(f"Created {len(chunks)} chunks")

            # 6. Generate embeddings
            embeddings = self.embedding_service.embed(chunks)
            logger.info(f"Generated {len(embeddings)} embeddings")

            # 7. Store in FAISS
            self.vector_store.add_documents(chunks, embeddings, document_id)
            logger.info(
                f"Stored in FAISS index for document {document_id}"
            )

            # 8. Generate summary via LLM
            summary_result = self.summary_service.generate_summary(cleaned_text)

            return {
                "text": cleaned_text,
                "summary": summary_result,
                "type": file_category,
                "chunks_count": len(chunks),
            }

        except Exception as e:
            logger.error(f"Document processing failed: {e}")
            raise

        finally:
            # Clean up saved file
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.debug(f"Cleaned up temporary file: {file_path}")
                except OSError:
                    pass

    async def process_url(self, file_url: str, document_id: str) -> dict:
        """
        Process a file directly from a URL (e.g. Supabase public URL).

        Handles both public and private Supabase storage buckets by attaching
        the Supabase API key as an auth header when the key is configured.
        Query-string tokens (e.g. ?token=...) in the URL are stripped before
        the filename/extension is parsed so the file router receives a proper
        extension.
        """
        import aiohttp
        from urllib.parse import urlparse, urlunparse
        from app.config import settings

        file_path = None
        try:
            # ── 1. Strip query-string / fragment before parsing the filename ──
            # Supabase signed URLs contain ?token=... which breaks splitext.
            parsed_url = urlparse(file_url)
            # Use only scheme + netloc + path (no query / fragment) for name parsing
            clean_path = parsed_url.path
            filename = os.path.basename(clean_path)
            if not filename:
                filename = "downloaded_file"

            _, ext = os.path.splitext(filename)
            if not ext:
                logger.warning(
                    f"Could not determine file extension from URL: {file_url}. "
                    "Defaulting to .pdf — update the URL or bucket policy if this fails."
                )
                ext = ".pdf"

            unique_name = f"{uuid.uuid4().hex}{ext}"
            file_path = os.path.join(self.upload_dir, unique_name)

            # ── 2. Build download headers (auth for private Supabase buckets) ──
            download_headers = {}
            if settings.SUPABASE_KEY:
                download_headers["apikey"] = settings.SUPABASE_KEY
                download_headers["Authorization"] = f"Bearer {settings.SUPABASE_KEY}"
                logger.debug("Attaching Supabase auth headers to download request")

            # Download file
            logger.info(f"Downloading file from URL: {file_url}")
            async with aiohttp.ClientSession() as session:
                async with session.get(file_url, headers=download_headers) as response:
                    if response.status != 200:
                        raise Exception(
                            f"Failed to download file from Supabase (HTTP {response.status}). "
                            "Check that the bucket is public or that SUPABASE_KEY is correct."
                        )
                    content = await response.read()
                    
            with open(file_path, "wb") as f:
                f.write(content)
                
            logger.info(f"Saved downloaded file to: {file_path}")
            
            # 2. Get file category for response
            file_category = get_file_type_category(ext)

            # 3. Route to correct processor and extract text
            result = route_file(file_path)
            raw_text = result["text"]
            logger.info(
                f"Extracted {len(raw_text)} characters (type={result['type']})"
            )

            # 4. Clean text
            cleaned_text = clean_text(raw_text)
            logger.info(f"Cleaned text: {len(cleaned_text)} characters")

            # 5. Chunk text
            chunks = chunk_text(
                cleaned_text,
                chunk_size=self.chunk_size,
                overlap=self.chunk_overlap,
            )
            logger.info(f"Created {len(chunks)} chunks")

            # 6. Generate embeddings
            embeddings = self.embedding_service.embed(chunks)
            logger.info(f"Generated {len(embeddings)} embeddings")

            # 7. Store in FAISS
            self.vector_store.add_documents(chunks, embeddings, document_id)
            logger.info(
                f"Stored in FAISS index for document {document_id}"
            )

            # 8. Generate summary via LLM
            summary_result = self.summary_service.generate_summary(cleaned_text)

            return {
                "text": cleaned_text,
                "summary": summary_result,
                "type": file_category,
                "chunks_count": len(chunks),
            }

        except Exception as e:
            logger.error(f"URL processing failed: {e}")
            raise

        finally:
            # Clean up saved file
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.debug(f"Cleaned up temporary file: {file_path}")
                except OSError:
                    pass

    async def _save_file(self, file) -> str:
        """Save an uploaded file to the upload directory."""
        # Generate a unique filename to avoid collisions
        _, ext = os.path.splitext(file.filename)
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(self.upload_dir, unique_name)

        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)

        return file_path

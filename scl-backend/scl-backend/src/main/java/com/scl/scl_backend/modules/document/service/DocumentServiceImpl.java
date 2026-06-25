package com.scl.scl_backend.modules.document.service;

import com.scl.scl_backend.modules.core.dto.ApiResponse;
import com.scl.scl_backend.modules.document.dto.DocumentResponse;
import com.scl.scl_backend.modules.document.dto.DocumentUpdateRequest;
import com.scl.scl_backend.modules.document.dto.DocumentUploadRequest;
import com.scl.scl_backend.modules.document.entity.Category;
import com.scl.scl_backend.modules.document.entity.Document;
import com.scl.scl_backend.modules.document.entity.DocumentStatus;
import com.scl.scl_backend.modules.document.repository.CategoryRepository;
import com.scl.scl_backend.modules.document.repository.DocumentRepository;
import com.scl.scl_backend.modules.core.dto.SupabaseStorageUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // generates a constructor for all final fields below -> no @Autowired needed
public class DocumentServiceImpl implements DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final SupabaseStorageUtil supabaseStorageUtil;

    // ─────────────────────────────────────────────────────────────────
    // UPLOAD
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> uploadDocument(MultipartFile file, DocumentUploadRequest request) {
        try {
            // 1. Basic validation — empty file check
            if (file == null || file.isEmpty()) {
                return new ApiResponse<>(false, "File is empty or missing", HttpStatus.BAD_REQUEST.value(), LocalDateTime.now());
            }

            // 2. Validate category exists
            Category category = null;
            if (request.getCategoryId() != null) {
                Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
                if (categoryOpt.isEmpty()) {
                    return new ApiResponse<>(false, "Category not found with id: " + request.getCategoryId(),
                            HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
                }
                category = categoryOpt.get();
            }

            // 3. Save the physical file to disk, get back a relative path/URL
            String fileUrl = supabaseStorageUtil.storeFile(file);

            // 4. Build the Document entity
            Document document = new Document();
            document.setTitle(request.getTitle());
            document.setDescription(request.getDescription());
            document.setFileName(file.getOriginalFilename());
            document.setFileUrl(fileUrl);
            document.setFileType(file.getContentType());
            document.setFileSize(file.getSize());
            document.setUploadedBy(request.getUploadedBy());
            document.setCategory(category);
            document.setStatus(DocumentStatus.ACTIVE);
            // uploadDate is set automatically by @CreatedDate (requires @EnableJpaAuditing in main app class)

            Document saved = documentRepository.save(document);
            logger.info("Document uploaded successfully: id={}, fileName={}", saved.getId(), saved.getFileName());

            return new ApiResponse<>(true, "Document uploaded successfully", HttpStatus.CREATED.value(),
                    LocalDateTime.now(), mapToResponse(saved));

        } catch (Exception e) {
            logger.error("Error uploading document: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to upload document: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // UPDATE
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> updateDocument(Long id, DocumentUpdateRequest request) {
        try {
            Optional<Document> documentOpt = documentRepository.findById(id);
            if (documentOpt.isEmpty()) {
                return new ApiResponse<>(false, "Document not found with id: " + id,
                        HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
            }

            Document document = documentOpt.get();

            // Only update fields that were actually provided
            if (request.getTitle() != null && !request.getTitle().isBlank()) {
                document.setTitle(request.getTitle());
            }

            if (request.getDescription() != null) {
                document.setDescription(request.getDescription());
            }

            if (request.getCategoryId() != null) {
                Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
                if (categoryOpt.isEmpty()) {
                    return new ApiResponse<>(false, "Category not found with id: " + request.getCategoryId(),
                            HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
                }
                document.setCategory(categoryOpt.get());
            }

            if (request.getStatus() != null && !request.getStatus().isBlank()) {
                try {
                    document.setStatus(DocumentStatus.valueOf(request.getStatus().toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    return new ApiResponse<>(false, "Invalid status value: " + request.getStatus()
                            + ". Allowed values: ACTIVE, INACTIVE, DELETED",
                            HttpStatus.BAD_REQUEST.value(), LocalDateTime.now());
                }
            }

            Document updated = documentRepository.save(document);
            logger.info("Document updated successfully: id={}", updated.getId());

            return new ApiResponse<>(true, "Document updated successfully", HttpStatus.OK.value(),
                    LocalDateTime.now(), mapToResponse(updated));

        } catch (Exception e) {
            logger.error("Error updating document: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to update document: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // GET BY ID
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> getDocumentById(Long id) {
        try {
            Optional<Document> documentOpt = documentRepository.findById(id);
            if (documentOpt.isEmpty()) {
                return new ApiResponse<>(false, "Document not found with id: " + id,
                        HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
            }

            return new ApiResponse<>(true, "Document retrieved successfully", HttpStatus.OK.value(),
                    LocalDateTime.now(), mapToResponse(documentOpt.get()));

        } catch (Exception e) {
            logger.error("Error fetching document: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to fetch document: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // GET ALL
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> getAllDocuments() {
        try {
            List<DocumentResponse> documents = documentRepository.findAll()
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            return new ApiResponse<>(true, "Documents retrieved successfully", HttpStatus.OK.value(),
                    LocalDateTime.now(), documents);

        } catch (Exception e) {
            logger.error("Error fetching documents: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to fetch documents: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // GET BY UPLOADED BY
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> getDocumentsByUploadedBy(String uploadedBy) {
        try {
            List<DocumentResponse> documents = documentRepository.findByUploadedBy(uploadedBy)
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            if (documents.isEmpty()) {
                return new ApiResponse<>(true, "No documents found for user: " + uploadedBy,
                        HttpStatus.OK.value(), LocalDateTime.now(), documents);
            }

            return new ApiResponse<>(true, "Documents retrieved successfully", HttpStatus.OK.value(),
                    LocalDateTime.now(), documents);

        } catch (Exception e) {
            logger.error("Error fetching documents by uploadedBy: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to fetch documents: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // GET BY CATEGORY
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> getDocumentsByCategory(Long categoryId) {
        try {
            // Confirm the category actually exists before querying documents
            Optional<Category> categoryOpt = categoryRepository.findById(categoryId);
            if (categoryOpt.isEmpty()) {
                return new ApiResponse<>(false, "Category not found with id: " + categoryId,
                        HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
            }

            List<DocumentResponse> documents = documentRepository.findByCategory_Id(Math.toIntExact(categoryId))
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            return new ApiResponse<>(true, "Documents retrieved successfully", HttpStatus.OK.value(),
                    LocalDateTime.now(), documents);

        } catch (Exception e) {
            logger.error("Error fetching documents by category: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to fetch documents: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> deleteDocument(Long id) {
        try {
            Optional<Document> documentOpt = documentRepository.findById(id);
            if (documentOpt.isEmpty()) {
                return new ApiResponse<>(false, "Document not found with id: " + id,
                        HttpStatus.NOT_FOUND.value(), LocalDateTime.now());
            }

            Document document = documentOpt.get();

            // Remove the physical file from disk first
            supabaseStorageUtil.deleteFile(document.getFileUrl());

            // Then remove the DB record
            documentRepository.delete(document);
            logger.info("Document deleted successfully: id={}", id);

            return new ApiResponse<>(true, "Document deleted successfully", HttpStatus.OK.value(), LocalDateTime.now());

        } catch (Exception e) {
            logger.error("Error deleting document: {}", e.getMessage(), e);
            return new ApiResponse<>(false, "Failed to delete document: " + e.getMessage(),
                    HttpStatus.INTERNAL_SERVER_ERROR.value(), LocalDateTime.now());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE HELPER — Entity -> DTO mapping
    // ─────────────────────────────────────────────────────────────────
    private DocumentResponse mapToResponse(Document document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId() != null ? document.getId().longValue() : null);
        response.setTitle(document.getTitle());
        response.setDescription(document.getDescription());
        response.setFileName(document.getFileName());
        response.setFileUrl(document.getFileUrl());
        response.setFileType(document.getFileType());
        response.setFileSize(document.getFileSize());
        response.setUploadDate(document.getUploadDate());
        response.setUploadedBy(document.getUploadedBy());
        response.setCategoryName(document.getCategory() != null ? document.getCategory().getName() : null);
        response.setStatus(document.getStatus() != null ? document.getStatus().name() : null);
        return response;
    }
}
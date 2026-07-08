package com.scl.modules.document.service;

import com.scl.common.ApiResponse;
import com.scl.modules.ai.dto.AiProcessResponse;
import com.scl.modules.ai.service.AiServiceClient;
import com.scl.modules.document.dto.DocumentResponse;
import com.scl.modules.document.dto.DocumentUpdateRequest;
import com.scl.modules.document.dto.DocumentUploadRequest;
import com.scl.modules.document.entity.Category;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.entity.DocumentStatus;
import com.scl.modules.document.repository.CategoryRepository;
import com.scl.modules.document.repository.DocumentRepository;
import com.scl.modules.document.entity.DocumentShare;
import com.scl.modules.document.repository.DocumentShareRepository;
import com.scl.modules.document.dto.DocumentShareRequest;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.auth.entity.User;
import com.scl.common.SupabaseStorageUtil;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

    private static final Logger logger = LoggerFactory.getLogger(DocumentServiceImpl.class);

    private final DocumentRepository documentRepository;
    private final CategoryRepository categoryRepository;
    private final SupabaseStorageUtil supabaseStorageUtil;
    private final AiServiceClient aiServiceClient;
    private final DocumentShareRepository documentShareRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────
    // UPLOAD
    // ─────────────────────────────────────────────────────────────────
    @Override
    @Transactional
    public ApiResponse<?> uploadDocument(MultipartFile file, DocumentUploadRequest request) {
        try {
            if (file == null || file.isEmpty()) {
                return ApiResponse.error("File is empty or missing");
            }

            Category category = null;
            if (request.getCategoryId() != null) {
                Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
                if (categoryOpt.isEmpty()) {
                    return ApiResponse.error("Category not found with id: " + request.getCategoryId());
                }
                category = categoryOpt.get();
            }

            String fileUrl = supabaseStorageUtil.storeFile(file);

            AiProcessResponse aiResponse = null;
            try {
                aiResponse = aiServiceClient.processDocumentByUrl(fileUrl);
            } catch (Exception e) {
                logger.error("AI Service processing failed: {}", e.getMessage());
            }

            Document document = new Document();
            document.setTitle(request.getTitle());
            document.setDescription(request.getDescription());
            document.setFileName(file.getOriginalFilename());
            document.setFileUrl(fileUrl);
            document.setFileType(file.getContentType());
            document.setFileSize(file.getSize());
            document.setUploadedBy(request.getUploadedBy() != null ? request.getUploadedBy() : "System");
            document.setCategory(category);
            document.setStatus(DocumentStatus.ACTIVE);
            
            if (aiResponse != null) {
                document.setAiSummary(aiResponse.getSummary());
                document.setExtractedText(aiResponse.getText());
                document.setChunksCount(aiResponse.getChunks_count());
            }

            Document saved = documentRepository.save(document);
            logger.info("Document uploaded successfully: id={}, fileName={}", saved.getId(), saved.getFileName());

            return ApiResponse.success("Document uploaded successfully", mapToResponse(saved));

        } catch (Exception e) {
            logger.error("Error uploading document: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to upload document: " + e.getMessage());
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
                return ApiResponse.error("Document not found with id: " + id);
            }

            Document document = documentOpt.get();

            if (request.getTitle() != null && !request.getTitle().isBlank()) {
                document.setTitle(request.getTitle());
            }

            if (request.getDescription() != null) {
                document.setDescription(request.getDescription());
            }

            if (request.getCategoryId() != null) {
                Optional<Category> categoryOpt = categoryRepository.findById(request.getCategoryId());
                if (categoryOpt.isEmpty()) {
                    return ApiResponse.error("Category not found with id: " + request.getCategoryId());
                }
                document.setCategory(categoryOpt.get());
            }

            if (request.getStatus() != null && !request.getStatus().isBlank()) {
                try {
                    document.setStatus(DocumentStatus.valueOf(request.getStatus().toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    return ApiResponse.error("Invalid status value: " + request.getStatus()
                            + ". Allowed values: ACTIVE, INACTIVE, DELETED");
                }
            }

            Document updated = documentRepository.save(document);
            logger.info("Document updated successfully: id={}", updated.getId());

            return ApiResponse.success("Document updated successfully", mapToResponse(updated));

        } catch (Exception e) {
            logger.error("Error updating document: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to update document: " + e.getMessage());
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
                return ApiResponse.error("Document not found with id: " + id);
            }

            return ApiResponse.success("Document retrieved successfully", mapToResponse(documentOpt.get()));

        } catch (Exception e) {
            logger.error("Error fetching document: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch document: " + e.getMessage());
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

            return ApiResponse.success("Documents retrieved successfully", documents);

        } catch (Exception e) {
            logger.error("Error fetching documents: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch documents: " + e.getMessage());
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
                return ApiResponse.success("No documents found for user: " + uploadedBy, documents);
            }

            return ApiResponse.success("Documents retrieved successfully", documents);

        } catch (Exception e) {
            logger.error("Error fetching documents by uploadedBy: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch documents: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // GET BY CATEGORY
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> getDocumentsByCategory(Long categoryId) {
        try {
            Optional<Category> categoryOpt = categoryRepository.findById(categoryId);
            if (categoryOpt.isEmpty()) {
                return ApiResponse.error("Category not found with id: " + categoryId);
            }

            List<DocumentResponse> documents = documentRepository.findByCategory_Id(Math.toIntExact(categoryId))
                    .stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());

            return ApiResponse.success("Documents retrieved successfully", documents);

        } catch (Exception e) {
            logger.error("Error fetching documents by category: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to fetch documents: " + e.getMessage());
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
                return ApiResponse.error("Document not found with id: " + id);
            }

            Document document = documentOpt.get();

            supabaseStorageUtil.deleteFile(document.getFileUrl());

            documentRepository.delete(document);
            logger.info("Document deleted successfully: id={}", id);

            return ApiResponse.success("Document deleted successfully", null);

        } catch (Exception e) {
            logger.error("Error deleting document: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to delete document: " + e.getMessage());
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // SHARE DOCUMENT
    // ─────────────────────────────────────────────────────────────────
    @Override
    public ApiResponse<?> shareDocument(DocumentShareRequest request) {
        try {
            Optional<Document> documentOpt = documentRepository.findById(request.getDocumentId());
            if (documentOpt.isEmpty()) {
                return ApiResponse.error("Document not found with id: " + request.getDocumentId());
            }

            Optional<User> userOpt = userRepository.findById(request.getSharedWithUserId());
            if (userOpt.isEmpty()) {
                return ApiResponse.error("User not found with id: " + request.getSharedWithUserId());
            }

            // Check if already shared
            boolean alreadyShared = documentShareRepository.existsByDocument_IdAndSharedWith_Id(
                    Math.toIntExact(request.getDocumentId()), request.getSharedWithUserId());
            if (alreadyShared) {
                return ApiResponse.error("Document is already shared with this user");
            }

            DocumentShare documentShare = new DocumentShare();
            documentShare.setDocument(documentOpt.get());
            documentShare.setSharedWith(userOpt.get());
            documentShare.setPermission(request.getPermission().toUpperCase());

            documentShareRepository.save(documentShare);
            logger.info("Document {} shared with User {}", request.getDocumentId(), request.getSharedWithUserId());

            return ApiResponse.success("Document shared successfully", null);
        } catch (Exception e) {
            logger.error("Error sharing document: {}", e.getMessage(), e);
            return ApiResponse.error("Failed to share document: " + e.getMessage());
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
        
        // AI Fields
        response.setAiSummary(document.getAiSummary());
        response.setExtractedText(document.getExtractedText());
        response.setChunksCount(document.getChunksCount());
        
        return response;
    }
}

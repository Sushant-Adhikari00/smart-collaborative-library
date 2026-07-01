package com.scl.modules.document.service;

import com.scl.common.ApiResponse;
import com.scl.modules.document.dto.DocumentResponse;
import com.scl.modules.document.dto.DocumentUpdateRequest;
import com.scl.modules.document.dto.DocumentUploadRequest;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface DocumentService {
    ApiResponse<?> uploadDocument(MultipartFile file, DocumentUploadRequest request);

    ApiResponse<?> updateDocument(Long id, DocumentUpdateRequest request);

    ApiResponse<?> getDocumentById(Long id);

    ApiResponse<?> getAllDocuments();

    ApiResponse<?> getDocumentsByUploadedBy(String uploadedBy);

    ApiResponse<?> getDocumentsByCategory(Long categoryId);

    ApiResponse<?> deleteDocument(Long id);
}

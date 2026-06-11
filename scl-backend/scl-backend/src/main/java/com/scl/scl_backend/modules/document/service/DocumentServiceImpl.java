package com.scl.scl_backend.modules.document.service;

import com.scl.scl_backend.modules.core.dto.ApiResponse;
import com.scl.scl_backend.modules.document.dto.DocumentResponse;
import com.scl.scl_backend.modules.document.dto.DocumentUpdateRequest;
import com.scl.scl_backend.modules.document.dto.DocumentUploadRequest;
import com.scl.scl_backend.modules.document.entity.Document;
import com.scl.scl_backend.modules.document.entity.DocumentStatus;
import com.scl.scl_backend.modules.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService{
    private static final Logger logger = LoggerFactory.getLogger(DocumentServiceImpl.class);

    @Autowired
    private DocumentRepository documentRepository;

    @Override
    public ApiResponse<?> uploadDocument(MultipartFile file, DocumentUploadRequest request) {
        return null;
    }

    @Override
    public ApiResponse<?> updateDocument(Long id, DocumentUpdateRequest request) {
        return null;
    }

    @Override
    public ApiResponse<?> getDocumentById(Long id) {
        return null;
    }

    @Override
    public ApiResponse<?> getAllDocuments() {
        return null;
    }

    @Override
    public ApiResponse<?> getDocumentsByUploadedBy(String uploadedBy) {
        return null;
    }

    @Override
    public ApiResponse<?> getDocumentsByCategory(Long categoryId) {
        return null;
    }

    @Override
    public ApiResponse<?> deleteDocument(Long id) {
        return null;
    }
}

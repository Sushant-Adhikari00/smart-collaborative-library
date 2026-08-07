package com.scl.modules.document.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.document.dto.DocumentShareRequest;
import com.scl.modules.document.dto.DocumentUpdateRequest;
import com.scl.modules.document.dto.DocumentUploadRequest;
import com.scl.modules.document.repository.CategoryRepository;
import com.scl.modules.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final CategoryRepository categoryRepository;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
    public ResponseEntity<ApiResponse<?>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("categoryId") Long categoryId,
            @RequestParam(value = "uploadedBy", required = false) String uploadedBy) {

        DocumentUploadRequest request = new DocumentUploadRequest();
        request.setTitle(title);
        request.setDescription(description);
        request.setCategoryId(categoryId);
        request.setUploadedBy(uploadedBy);

        ApiResponse<?> response = documentService.uploadDocument(file, request);
        return response.isSuccess()
                ? ResponseEntity.status(HttpStatus.CREATED).body(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getDocumentById(@PathVariable Long id) {
        ApiResponse<?> response = documentService.getDocumentById(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllDocuments() {
        ApiResponse<?> response = documentService.getAllDocuments();
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<?>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.success("Categories fetched", categoryRepository.findAll()));
    }

    @GetMapping("/uploaded-by/{uploadedBy}")
    public ResponseEntity<ApiResponse<?>> getDocumentsByUploadedBy(@PathVariable String uploadedBy) {
        ApiResponse<?> response = documentService.getDocumentsByUploadedBy(uploadedBy);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<?>> getDocumentsByCategory(@PathVariable Long categoryId) {
        ApiResponse<?> response = documentService.getDocumentsByCategory(categoryId);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentUpdateRequest request,
            Authentication authentication) {
        String requesterEmail = authentication.getName();
        ApiResponse<?> response = documentService.updateDocument(id, request, requesterEmail);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteDocument(@PathVariable Long id, Authentication authentication) {
        String requesterEmail = authentication.getName();
        ApiResponse<?> response = documentService.deleteDocument(id, requesterEmail);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }

    @PostMapping("/share")
    public ResponseEntity<ApiResponse<?>> shareDocument(@RequestBody @jakarta.validation.Valid DocumentShareRequest request) {
        ApiResponse<?> response = documentService.shareDocument(request);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/{id}/reprocess")
    public ResponseEntity<ApiResponse<?>> reprocessDocument(@PathVariable Long id) {
        ApiResponse<?> response = documentService.reprocessDocument(id);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    @PostMapping("/reprocess-all")
    public ResponseEntity<ApiResponse<?>> reprocessAllDocuments() {
        ApiResponse<?> response = documentService.reprocessAllDocuments();
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}


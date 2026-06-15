package com.scl.scl_backend.modules.document.controller;

import com.scl.scl_backend.modules.core.dto.ApiResponse;
import com.scl.scl_backend.modules.document.dto.DocumentUpdateRequest;
import com.scl.scl_backend.modules.document.dto.DocumentUploadRequest;
import com.scl.scl_backend.modules.document.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    // Reads from application.yml → app.upload.dir
    @Value("${app.upload.dir:uploads/documents}")
    private String uploadDir;

    // ─────────────────────────────────────────────────────────────────
    // UPLOAD
    // Postman → Body → form-data:
    //   file        [File] → select file
    //   title       [Text] → Lecture 1
    //   description [Text] → optional
    //   categoryId  [Text] → 1
    //   uploadedBy  [Text] → john
    // ─────────────────────────────────────────────────────────────────
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
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // VIEW / DOWNLOAD ACTUAL FILE
    // GET /api/v1/documents/files/{filename}
    //
    // How to use:
    //   1. Call GET /api/v1/documents/{id} → copy "fileUrl" value
    //      e.g. /files/8cf4d5a9-xxxx.pdf
    //   2. Take the filename after /files/
    //      e.g. 8cf4d5a9-xxxx.pdf
    //   3. Open in browser:
    //      http://localhost:8080/api/v1/documents/files/8cf4d5a9-xxxx.pdf
    //
    // {filename:.+} — the .+ regex allows dots in filename so Spring
    // does not strip the file extension (.pdf, .docx etc.)
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/files/{filename:.+}")
    public ResponseEntity<Resource> serveFile(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir)
                    .toAbsolutePath()
                    .normalize()
                    .resolve(filename);

            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = detectContentType(filename);

            return ResponseEntity.ok()
                    // "inline"     → browser opens PDF/image directly
                    // "attachment" → browser downloads the file
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "inline; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(resource);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // GET METADATA BY ID — returns JSON, NOT the file bytes
    // Use "fileUrl" from this response to build the /files/{filename} URL
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> getDocumentById(@PathVariable Long id) {
        ApiResponse<?> response = documentService.getDocumentById(id);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // GET ALL DOCUMENTS — metadata list for dashboard/browse page
    // ─────────────────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<?>> getAllDocuments() {
        ApiResponse<?> response = documentService.getAllDocuments();
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // GET BY UPLOADER
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/uploaded-by/{uploadedBy}")
    public ResponseEntity<ApiResponse<?>> getDocumentsByUploadedBy(
            @PathVariable String uploadedBy) {
        ApiResponse<?> response = documentService.getDocumentsByUploadedBy(uploadedBy);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // GET BY CATEGORY
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<?>> getDocumentsByCategory(
            @PathVariable Long categoryId) {
        ApiResponse<?> response = documentService.getDocumentsByCategory(categoryId);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // UPDATE — Body → raw → JSON
    // { "title": "New Title", "description": "...", "status": "ACTIVE" }
    // ─────────────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> updateDocument(
            @PathVariable Long id,
            @RequestBody DocumentUpdateRequest request) {
        ApiResponse<?> response = documentService.updateDocument(id, request);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // DELETE
    // ─────────────────────────────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<?>> deleteDocument(@PathVariable Long id) {
        ApiResponse<?> response = documentService.deleteDocument(id);
        return ResponseEntity.status(response.getStatusCode()).body(response);
    }

    // ─────────────────────────────────────────────────────────────────
    // PRIVATE HELPER — maps extension → MIME type
    // Browser uses this to decide: open inline vs prompt download
    // ─────────────────────────────────────────────────────────────────
    private String detectContentType(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".pdf"))  return "application/pdf";
        if (lower.endsWith(".png"))  return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".doc"))  return "application/msword";
        if (lower.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (lower.endsWith(".xls"))  return "application/vnd.ms-excel";
        if (lower.endsWith(".csv"))  return "text/csv";
        if (lower.endsWith(".mp4"))  return "video/mp4";
        if (lower.endsWith(".txt"))  return "text/plain";
        return "application/octet-stream"; // browser prompts download for unknown types
    }
}
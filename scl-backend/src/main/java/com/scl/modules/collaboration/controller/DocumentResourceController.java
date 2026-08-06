package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.DocumentResourceResponse;
import com.scl.modules.collaboration.service.DocumentResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/collaboration/documents/{documentId}/resources", "/api/collaboration/documents/{documentId}/resources"})
@RequiredArgsConstructor
public class DocumentResourceController {

    private final DocumentResourceService resourceService;
    private final UserRepository userRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<DocumentResourceResponse>> uploadResource(
            @PathVariable Long documentId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        DocumentResourceResponse response = resourceService.uploadResource(documentId, title, description, file, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Document resource uploaded successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DocumentResourceResponse>>> getDocumentResources(
            @PathVariable Long documentId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<DocumentResourceResponse> response = resourceService.getDocumentResources(documentId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched document resources", response));
    }

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<String>> deleteResource(
            @PathVariable Long documentId,
            @PathVariable Long resourceId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        resourceService.deleteResource(documentId, resourceId, user);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", "Resource " + resourceId + " deleted"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}

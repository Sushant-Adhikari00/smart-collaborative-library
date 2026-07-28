package com.scl.modules.document.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.document.dto.*;
import com.scl.modules.document.service.DocumentFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentFeedbackController {

    private final DocumentFeedbackService feedbackService;
    private final UserRepository userRepository;

    // ─── COMMENTS ─────────────────────────────────────────────────────────────

    @GetMapping("/{documentId}/comments")
    public ResponseEntity<ApiResponse<List<DocumentCommentResponse>>> getComments(
            @PathVariable Long documentId) {
        return ResponseEntity.ok(ApiResponse.success("Comments fetched",
                feedbackService.getComments(documentId)));
    }

    @PostMapping("/{documentId}/comments")
    public ResponseEntity<ApiResponse<DocumentCommentResponse>> addComment(
            @PathVariable Long documentId,
            @Valid @RequestBody AddDocumentCommentRequest request,
            Authentication authentication) {
        User user = resolveUser(authentication);
        DocumentCommentResponse response = feedbackService.addComment(documentId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added", response));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<String>> deleteComment(
            @PathVariable Long commentId,
            Authentication authentication) {
        User user = resolveUser(authentication);
        feedbackService.deleteComment(commentId, user);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted", "OK"));
    }

    // ─── RATINGS ──────────────────────────────────────────────────────────────

    @GetMapping("/{documentId}/rating")
    public ResponseEntity<ApiResponse<DocumentRatingResponse>> getRating(
            @PathVariable Long documentId,
            Authentication authentication) {
        User user = authentication != null ? resolveUserOptional(authentication) : null;
        return ResponseEntity.ok(ApiResponse.success("Rating fetched",
                feedbackService.getRating(documentId, user)));
    }

    @PostMapping("/{documentId}/rate")
    public ResponseEntity<ApiResponse<DocumentRatingResponse>> rateDocument(
            @PathVariable Long documentId,
            @RequestBody Map<String, Integer> body,
            Authentication authentication) {
        User user = resolveUser(authentication);
        int stars = body.getOrDefault("rating", 0);
        DocumentRatingResponse response = feedbackService.rateDocument(documentId, stars, user);
        return ResponseEntity.ok(ApiResponse.success("Rating submitted", response));
    }

    // ─── HELPERS ──────────────────────────────────────────────────────────────

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new RuntimeException("Authentication required");
        }
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found: " + authentication.getName()));
    }

    private User resolveUserOptional(Authentication authentication) {
        try {
            return userRepository.findByEmail(authentication.getName()).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}

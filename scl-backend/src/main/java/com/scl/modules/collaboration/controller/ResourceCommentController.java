package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.AddCommentRequest;
import com.scl.modules.collaboration.dto.CommentResponse;
import com.scl.modules.collaboration.service.ResourceCommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/collaboration", "/api/collaboration"})
@RequiredArgsConstructor
public class ResourceCommentController {

    private final ResourceCommentService commentService;
    private final UserRepository userRepository;

    @GetMapping("/resources/{resourceId}/comments")
    public ResponseEntity<ApiResponse<List<CommentResponse>>> getResourceComments(
            @PathVariable Long resourceId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<CommentResponse> comments = commentService.getResourceComments(resourceId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched resource comments", comments));
    }

    @PostMapping("/resources/{resourceId}/comments")
    public ResponseEntity<ApiResponse<CommentResponse>> addComment(
            @PathVariable Long resourceId,
            @Valid @RequestBody AddCommentRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        CommentResponse response = commentService.addComment(resourceId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added successfully", response));
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<CommentResponse>> editComment(
            @PathVariable Long commentId,
            @RequestBody AddCommentRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        CommentResponse response = commentService.editComment(commentId, request.getContent(), user);
        return ResponseEntity.ok(ApiResponse.success("Comment updated successfully", response));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<ApiResponse<String>> deleteComment(
            @PathVariable Long commentId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        commentService.deleteComment(commentId, user);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully", "Comment " + commentId + " deleted"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}

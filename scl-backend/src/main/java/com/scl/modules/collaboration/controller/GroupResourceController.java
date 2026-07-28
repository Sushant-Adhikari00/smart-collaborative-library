package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.ResourceResponse;
import com.scl.modules.collaboration.service.GroupResourceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/collaboration/groups/{groupId}/resources", "/api/collaboration/groups/{groupId}/resources"})
@RequiredArgsConstructor
public class GroupResourceController {

    private final GroupResourceService resourceService;
    private final UserRepository userRepository;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ResourceResponse>> uploadResource(
            @PathVariable Long groupId,
            @RequestParam(value = "title", required = false) String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        ResourceResponse response = resourceService.uploadResource(groupId, title, description, file, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Group resource uploaded successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ResourceResponse>>> getGroupResources(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<ResourceResponse> response = resourceService.getGroupResources(groupId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched group resources", response));
    }

    @GetMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<ResourceResponse>> getResourceById(
            @PathVariable Long groupId,
            @PathVariable Long resourceId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        ResourceResponse response = resourceService.getResourceById(groupId, resourceId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched resource details", response));
    }

    @PatchMapping("/{resourceId}/verify")
    public ResponseEntity<ApiResponse<ResourceResponse>> toggleVerification(
            @PathVariable Long groupId,
            @PathVariable Long resourceId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        ResourceResponse response = resourceService.toggleVerification(groupId, resourceId, user);
        return ResponseEntity.ok(ApiResponse.success("Resource verification updated", response));
    }

    @PatchMapping("/{resourceId}/pin")
    public ResponseEntity<ApiResponse<ResourceResponse>> togglePin(
            @PathVariable Long groupId,
            @PathVariable Long resourceId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        ResourceResponse response = resourceService.togglePin(groupId, resourceId, user);
        return ResponseEntity.ok(ApiResponse.success("Resource pin status updated", response));
    }

    @DeleteMapping("/{resourceId}")
    public ResponseEntity<ApiResponse<String>> deleteResource(
            @PathVariable Long groupId,
            @PathVariable Long resourceId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        resourceService.deleteResource(groupId, resourceId, user);
        return ResponseEntity.ok(ApiResponse.success("Resource deleted successfully", "Resource " + resourceId + " deleted"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}

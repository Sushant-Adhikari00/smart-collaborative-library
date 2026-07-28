package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.AnnouncementResponse;
import com.scl.modules.collaboration.dto.CreateAnnouncementRequest;
import com.scl.modules.collaboration.service.TeacherAnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/collaboration/groups/{groupId}/announcements", "/api/collaboration/groups/{groupId}/announcements"})
@RequiredArgsConstructor
public class TeacherAnnouncementController {

    private final TeacherAnnouncementService announcementService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @PathVariable Long groupId,
            @Valid @RequestBody CreateAnnouncementRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        AnnouncementResponse response = announcementService.createAnnouncement(groupId, request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Announcement posted successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getGroupAnnouncements(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<AnnouncementResponse> announcements = announcementService.getGroupAnnouncements(groupId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched group announcements", announcements));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}

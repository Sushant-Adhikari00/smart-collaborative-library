package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.*;
import com.scl.modules.collaboration.service.CollaborationGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/collaboration/groups", "/api/collaboration/groups"})
@RequiredArgsConstructor
public class CollaborationGroupController {

    private final CollaborationGroupService groupService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<ApiResponse<GroupResponse>> createGroup(
            @Valid @RequestBody CreateGroupRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        GroupResponse response = groupService.createGroup(request, user);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Study group created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GroupResponse>>> getUserGroups(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<GroupResponse> response = groupService.getUserGroups(user);
        return ResponseEntity.ok(ApiResponse.success("Fetched user study groups", response));
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupResponse>> getGroupById(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        GroupResponse response = groupService.getGroupById(groupId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched study group details", response));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<ApiResponse<GroupResponse>> updateGroup(
            @PathVariable Long groupId,
            @RequestBody UpdateGroupRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        GroupResponse response = groupService.updateGroup(groupId, request, user);
        return ResponseEntity.ok(ApiResponse.success("Study group updated successfully", response));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<ApiResponse<String>> deleteGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        groupService.deleteGroup(groupId, user);
        return ResponseEntity.ok(ApiResponse.success("Study group deleted successfully", "Group " + groupId + " deleted"));
    }

    @PostMapping("/join")
    public ResponseEntity<ApiResponse<GroupResponse>> joinGroup(
            @Valid @RequestBody JoinGroupRequest request,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        GroupResponse response = groupService.joinGroupByInviteCode(request, user);
        return ResponseEntity.ok(ApiResponse.success("Joined study group successfully", response));
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<ApiResponse<String>> leaveGroup(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        groupService.leaveGroup(groupId, user);
        return ResponseEntity.ok(ApiResponse.success("Left study group successfully", "Left group " + groupId));
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<ApiResponse<List<GroupMemberResponse>>> getGroupMembers(
            @PathVariable Long groupId,
            Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        List<GroupMemberResponse> members = groupService.getGroupMembers(groupId, user);
        return ResponseEntity.ok(ApiResponse.success("Fetched group members", members));
    }

    @PutMapping("/{groupId}/members/{targetUserId}/role")
    public ResponseEntity<ApiResponse<GroupMemberResponse>> updateMemberRole(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        GroupMemberResponse response = groupService.updateMemberRole(groupId, targetUserId, request.getRole(), currentUser);
        return ResponseEntity.ok(ApiResponse.success("Updated member role", response));
    }

    @DeleteMapping("/{groupId}/members/{targetUserId}")
    public ResponseEntity<ApiResponse<String>> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            Authentication authentication) {
        User currentUser = getAuthenticatedUser(authentication);
        groupService.removeMember(groupId, targetUserId, currentUser);
        return ResponseEntity.ok(ApiResponse.success("Member removed from group", "Member " + targetUserId + " removed"));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}

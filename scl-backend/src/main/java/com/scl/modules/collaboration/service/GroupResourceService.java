package com.scl.modules.collaboration.service;

import com.scl.common.SupabaseStorageUtil;
import com.scl.modules.ai.dto.AiProcessResponse;
import com.scl.modules.ai.service.AiServiceClient;
import com.scl.modules.auth.entity.Role;
import com.scl.modules.auth.entity.User;
import com.scl.modules.collaboration.dto.ResourceResponse;
import com.scl.modules.collaboration.entity.*;
import com.scl.modules.collaboration.repository.CollaborationGroupRepository;
import com.scl.modules.collaboration.repository.GroupMemberRepository;
import com.scl.modules.collaboration.repository.GroupResourceRepository;
import com.scl.modules.collaboration.repository.ResourceCommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GroupResourceService {

    private final GroupResourceRepository resourceRepository;
    private final CollaborationGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final ResourceCommentRepository commentRepository;
    private final SupabaseStorageUtil storageUtil;
    private final AiServiceClient aiServiceClient;
    private final NotificationService notificationService;
    private final CollaborationGroupService groupService;

    @Transactional
    public ResourceResponse uploadResource(Long groupId, String title, String description,
                                           MultipartFile file, User uploader) {
        groupService.validateMembership(groupId, uploader.getId());

        CollaborationGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File cannot be empty");
        }

        String fileUrl = storageUtil.storeFile(file);
        String fileName = file.getOriginalFilename();
        String fileType = SupabaseStorageUtil.resolveContentType(file);
        long fileSize = file.getSize();

        GroupResource resource = GroupResource.builder()
                .group(group)
                .uploader(uploader)
                .title(title != null && !title.isBlank() ? title : fileName)
                .description(description)
                .fileName(fileName)
                .fileUrl(fileUrl)
                .fileType(fileType)
                .fileSize(fileSize)
                .isVerified(uploader.getRole() == Role.TEACHER)
                .isPinned(false)
                .build();

        GroupResource savedResource = resourceRepository.save(resource);

        // Process document with AI service asynchronously/inline
        try {
            AiProcessResponse aiResponse = aiServiceClient.processDocumentByUrl(fileUrl, savedResource.getId().toString());
            if (aiResponse != null) {
                if (aiResponse.getSummary() != null) {
                    savedResource.setAiSummary(aiResponse.getSummary().getSummary());
                    if (aiResponse.getSummary().getKey_points() != null) {
                        savedResource.setAiKeyPoints(String.join("\n", aiResponse.getSummary().getKey_points()));
                    }
                    if (aiResponse.getSummary().getKeywords() != null) {
                        savedResource.setAiKeywords(String.join(", ", aiResponse.getSummary().getKeywords()));
                    }
                }
                savedResource = resourceRepository.save(savedResource);
            }
        } catch (Exception e) {
            log.warn("AI processing failed for resource {}: {}", savedResource.getId(), e.getMessage());
        }

        // Notify Group Members
        notifyGroupMembers(group, uploader, "New Resource Shared",
                uploader.getFullName() + " shared a resource: " + savedResource.getTitle(),
                NotificationType.RESOURCE_UPLOADED, "/collaboration/groups/" + groupId);

        return mapToResponse(savedResource);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getGroupResources(Long groupId, User user) {
        groupService.validateMembership(groupId, user.getId());

        return resourceRepository.findByGroupIdOrderByUploadedAtDesc(groupId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ResourceResponse getResourceById(Long groupId, Long resourceId, User user) {
        groupService.validateMembership(groupId, user.getId());

        GroupResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        if (!resource.getGroup().getId().equals(groupId)) {
            throw new RuntimeException("Resource does not belong to group");
        }

        return mapToResponse(resource);
    }

    @Transactional
    public ResourceResponse toggleVerification(Long groupId, Long resourceId, User user) {
        if (user.getRole() != Role.TEACHER && user.getRole() != Role.ADMIN) {
            throw new RuntimeException("Only teachers or admins can verify resources");
        }

        groupService.validateMembership(groupId, user.getId());

        GroupResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        resource.setIsVerified(!resource.getIsVerified());
        GroupResource updated = resourceRepository.save(resource);

        if (updated.getIsVerified()) {
            notificationService.sendNotification(
                    resource.getUploader(),
                    "Resource Verified",
                    "Teacher " + user.getFullName() + " verified your resource: " + resource.getTitle(),
                    NotificationType.RESOURCE_VERIFIED,
                    "/collaboration/groups/" + groupId
            );
        }

        return mapToResponse(updated);
    }

    @Transactional
    public ResourceResponse togglePin(Long groupId, Long resourceId, User user) {
        groupService.validateMembership(groupId, user.getId());

        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (member.getGroupRole() != GroupRole.OWNER && member.getGroupRole() != GroupRole.MODERATOR
                && user.getRole() != Role.TEACHER) {
            throw new RuntimeException("Only Owners, Moderators, or Teachers can pin resources");
        }

        GroupResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        resource.setIsPinned(!resource.getIsPinned());
        GroupResource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteResource(Long groupId, Long resourceId, User user) {
        groupService.validateMembership(groupId, user.getId());

        GroupResource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId()).orElse(null);

        boolean isUploader = resource.getUploader().getId().equals(user.getId());
        boolean isGroupAdmin = member != null && (member.getGroupRole() == GroupRole.OWNER || member.getGroupRole() == GroupRole.MODERATOR);
        boolean isTeacher = user.getRole() == Role.TEACHER || user.getRole() == Role.ADMIN;

        if (!isUploader && !isGroupAdmin && !isTeacher) {
            throw new RuntimeException("Permission denied to delete resource");
        }

        storageUtil.deleteFile(resource.getFileUrl());
        resourceRepository.delete(resource);
    }

    private void notifyGroupMembers(CollaborationGroup group, User sender, String title, String message,
                                   NotificationType type, String targetUrl) {
        List<GroupMember> members = memberRepository.findByGroupId(group.getId());
        for (GroupMember member : members) {
            if (!member.getUser().getId().equals(sender.getId())) {
                notificationService.sendNotification(member.getUser(), title, message, type, targetUrl);
            }
        }
    }

    public ResourceResponse mapToResponse(GroupResource resource) {
        long commentCount = commentRepository.countByResourceId(resource.getId());

        return ResourceResponse.builder()
                .id(resource.getId())
                .groupId(resource.getGroup().getId())
                .uploaderId(resource.getUploader().getId())
                .uploaderName(resource.getUploader().getFullName())
                .uploaderRole(resource.getUploader().getRole().name())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .fileName(resource.getFileName())
                .fileUrl(resource.getFileUrl())
                .fileType(resource.getFileType())
                .fileSize(resource.getFileSize())
                .isVerified(resource.getIsVerified())
                .isPinned(resource.getIsPinned())
                .aiSummary(resource.getAiSummary())
                .aiKeyPoints(resource.getAiKeyPoints())
                .aiKeywords(resource.getAiKeywords())
                .commentCount(commentCount)
                .uploadedAt(resource.getUploadedAt())
                .build();
    }
}

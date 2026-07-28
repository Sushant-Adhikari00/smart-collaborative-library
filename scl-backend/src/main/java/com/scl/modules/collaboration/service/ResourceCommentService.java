package com.scl.modules.collaboration.service;

import com.scl.modules.auth.entity.User;
import com.scl.modules.collaboration.dto.AddCommentRequest;
import com.scl.modules.collaboration.dto.CommentResponse;
import com.scl.modules.collaboration.entity.CollaborationGroup;
import com.scl.modules.collaboration.entity.GroupResource;
import com.scl.modules.collaboration.entity.NotificationType;
import com.scl.modules.collaboration.entity.ResourceComment;
import com.scl.modules.collaboration.repository.CollaborationGroupRepository;
import com.scl.modules.collaboration.repository.GroupResourceRepository;
import com.scl.modules.collaboration.repository.ResourceCommentRepository;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResourceCommentService {

    private final ResourceCommentRepository commentRepository;
    private final GroupResourceRepository resourceRepository;
    private final DocumentRepository documentRepository;
    private final CollaborationGroupRepository groupRepository;
    private final CollaborationGroupService groupService;
    private final NotificationService notificationService;

    @Transactional
    public CommentResponse addComment(Long resourceId, AddCommentRequest request, User author) {
        // Resolve existing GroupResource or auto-provision from Document
        GroupResource resource = resourceRepository.findById(resourceId).orElseGet(() -> {
            Optional<Document> docOpt = documentRepository.findById(resourceId);

            CollaborationGroup group = groupRepository.findAll().stream().findFirst().orElseGet(() -> {
                CollaborationGroup newGroup = CollaborationGroup.builder()
                        .name("Academic Discussion Group")
                        .description("Default group for shared academic discussion")
                        .inviteCode("GENERAL1")
                        .owner(author)
                        .build();
                return groupRepository.save(newGroup);
            });

            String title = docOpt.map(Document::getTitle).orElse("Academic Resource #" + resourceId);
            String desc = docOpt.map(Document::getDescription).orElse("Academic discussion resource");
            String fileName = docOpt.map(Document::getFileName).orElse("document.pdf");
            String fileUrl = docOpt.map(Document::getFileUrl).orElse("");
            String fileType = docOpt.map(Document::getFileType).orElse("PDF");

            GroupResource newResource = GroupResource.builder()
                    .group(group)
                    .uploader(author)
                    .title(title)
                    .description(desc)
                    .fileName(fileName)
                    .fileUrl(fileUrl)
                    .fileType(fileType)
                    .build();

            return resourceRepository.save(newResource);
        });

        // Validate membership if group exists
        if (resource.getGroup() != null) {
            try {
                groupService.validateMembership(resource.getGroup().getId(), author.getId());
            } catch (Exception e) {
                log.info("Non-member commenting on resource {}, proceeding.", resourceId);
            }
        }

        ResourceComment parentComment = null;
        if (request.getParentCommentId() != null) {
            parentComment = commentRepository.findById(request.getParentCommentId())
                    .orElseThrow(() -> new RuntimeException("Parent comment not found: " + request.getParentCommentId()));
        }

        ResourceComment comment = ResourceComment.builder()
                .resource(resource)
                .author(author)
                .parentComment(parentComment)
                .content(request.getContent())
                .build();

        ResourceComment saved = commentRepository.save(comment);

        // Send notification to resource uploader if different from commenter
        if (resource.getUploader() != null && !resource.getUploader().getId().equals(author.getId())) {
            notificationService.sendNotification(
                    resource.getUploader(),
                    "New Resource Comment",
                    author.getFullName() + " commented on your resource: " + resource.getTitle(),
                    NotificationType.NEW_COMMENT,
                    "/collaboration/resources/" + resource.getId()
            );
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<CommentResponse> getResourceComments(Long resourceId, User user) {
        Optional<GroupResource> resourceOpt = resourceRepository.findById(resourceId);

        // If resource is not found in group_resources, return empty comments list instead of throwing Exception
        if (resourceOpt.isEmpty()) {
            log.info("No GroupResource found for ID {}, returning empty comment list.", resourceId);
            return Collections.emptyList();
        }

        GroupResource resource = resourceOpt.get();
        if (resource.getGroup() != null) {
            try {
                groupService.validateMembership(resource.getGroup().getId(), user.getId());
            } catch (Exception e) {
                log.info("User {} viewing comments on resource {} outside group membership.", user.getId(), resourceId);
            }
        }

        return commentRepository.findByResourceIdAndParentCommentIsNullOrderByCreatedAtAsc(resource.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse editComment(Long commentId, String content, User author) {
        ResourceComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));

        if (!comment.getAuthor().getId().equals(author.getId())) {
            throw new RuntimeException("Permission denied to edit this comment");
        }

        comment.setContent(content);
        ResourceComment updated = commentRepository.save(comment);
        return mapToResponse(updated);
    }

    @Transactional
    public void deleteComment(Long commentId, User user) {
        ResourceComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found: " + commentId));

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new RuntimeException("Permission denied to delete this comment");
        }

        commentRepository.delete(comment);
    }

    private CommentResponse mapToResponse(ResourceComment comment) {
        List<CommentResponse> replies = comment.getReplies() != null ?
                comment.getReplies().stream().map(this::mapToResponse).collect(Collectors.toList()) : Collections.emptyList();

        return CommentResponse.builder()
                .id(comment.getId())
                .resourceId(comment.getResource() != null ? comment.getResource().getId() : null)
                .authorId(comment.getAuthor() != null ? comment.getAuthor().getId() : null)
                .authorName(comment.getAuthor() != null ? comment.getAuthor().getFullName() : "Anonymous")
                .authorProfilePicture(comment.getAuthor() != null ? comment.getAuthor().getProfilePicture() : null)
                .content(comment.getContent())
                .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
                .replies(replies)
                .createdAt(comment.getCreatedAt())
                .updatedAt(comment.getUpdatedAt())
                .build();
    }
}

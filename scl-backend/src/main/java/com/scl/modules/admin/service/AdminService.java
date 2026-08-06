package com.scl.modules.admin.service;

import com.scl.audit.entity.AuditLog;
import com.scl.audit.repository.AuditRepository;
import com.scl.common.PageResponse;
import com.scl.common.SupabaseStorageUtil;
import com.scl.exception.ResourceNotFoundException;
import com.scl.modules.admin.dto.AdminUserResponse;
import com.scl.modules.admin.dto.AnalyticsResponse;
import com.scl.modules.auth.entity.Role;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.chat.repository.ChatMessageRepository;
import com.scl.modules.collaboration.repository.CollaborationRequestRepository;
import com.scl.modules.collaboration.repository.DocumentResourceRepository;
import com.scl.modules.document.entity.Document;
import com.scl.modules.document.repository.DocumentCommentRepository;
import com.scl.modules.document.repository.DocumentRatingRepository;
import com.scl.modules.document.repository.DocumentRepository;
import com.scl.modules.document.repository.DocumentShareRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final AuditRepository auditRepository;
    private final DocumentRepository documentRepository;
    private final DocumentShareRepository documentShareRepository;
    private final DocumentCommentRepository documentCommentRepository;
    private final DocumentRatingRepository documentRatingRepository;
    private final CollaborationRequestRepository collaborationRequestRepository;
    private final DocumentResourceRepository documentResourceRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SupabaseStorageUtil supabaseStorageUtil;

    /**
     * Get all users with pagination.
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> getAllUsers(Pageable pageable) {
        log.debug("Fetching all users, page: {}", pageable.getPageNumber());

        Page<AdminUserResponse> page = userRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::mapToAdminUserResponse);

        return PageResponse.from(page);
    }

    /**
     * Update a user's role.
     */
    @Transactional
    public void updateUserRole(Long userId, Role newRole) {
        log.debug("Updating role for userId: {} to {}", userId, newRole);

        User user = findUserById(userId);
        user.setRole(newRole);
        userRepository.save(user);

        log.info("Role updated for user {} to {}", user.getEmail(), newRole);
    }

    /**
     * Deactivate a user account.
     */
    @Transactional
    public void deactivateUser(Long userId) {
        log.debug("Deactivating userId: {}", userId);

        User user = findUserById(userId);
        user.setIsActive(false);
        userRepository.save(user);

        log.info("User deactivated: {}", user.getEmail());
    }

    /**
     * Activate a user account.
     */
    @Transactional
    public void activateUser(Long userId) {
        log.debug("Activating userId: {}", userId);

        User user = findUserById(userId);
        user.setIsActive(true);
        userRepository.save(user);

        log.info("User activated: {}", user.getEmail());
    }

    /**
     * Force delete a document by ID.
     */
    @Transactional
    public void forceDeleteDocument(Long documentId) {
        log.info("forceDeleteDocument called for documentId: {}", documentId);

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

        if (document.getFileUrl() != null && !document.getFileUrl().isBlank()) {
            try {
                supabaseStorageUtil.deleteFile(document.getFileUrl());
            } catch (Exception e) {
                log.warn("Failed to delete file from storage for document {}: {}", documentId, e.getMessage());
            }
        }

        // Clean up child dependencies to prevent FK constraint failures
        documentShareRepository.deleteByDocument_Id(Math.toIntExact(documentId));
        documentCommentRepository.deleteByDocumentId(documentId);
        documentRatingRepository.deleteByDocumentId(documentId);
        collaborationRequestRepository.deleteByDocumentId(documentId);
        documentResourceRepository.deleteByDocumentId(documentId);

        documentRepository.delete(document);
        log.info("Document with ID {} force deleted successfully", documentId);
    }

    /**
     * Get platform analytics.
     */
    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalytics() {
        log.debug("Generating platform analytics");

        long totalUsers = userRepository.count();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        long activeUsersToday = userRepository.countActiveUsersSince(startOfToday);

        long totalDocuments = documentRepository.count();
        LocalDateTime startOfWeek = LocalDate.now().minusDays(7).atStartOfDay();
        long documentsUploadedThisWeek = documentRepository.countByUploadDateAfter(startOfWeek);
        long totalChatMessages = chatMessageRepository.count();

        return AnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalDocuments(totalDocuments)
                .totalSummaries(0)
                .totalChatMessages(totalChatMessages)
                .activeUsersToday(activeUsersToday)
                .documentsUploadedThisWeek(documentsUploadedThisWeek)
                .popularSubjects(Collections.emptyMap())
                .build();
    }

    /**
     * Get audit logs with pagination.
     */
    @Transactional(readOnly = true)
    public PageResponse<AuditLog> getAuditLogs(Pageable pageable) {
        log.debug("Fetching audit logs, page: {}", pageable.getPageNumber());

        Page<AuditLog> page = auditRepository.findAllByOrderByCreatedAtDesc(pageable);
        return PageResponse.from(page);
    }

    // ---- Private helpers ----

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private AdminUserResponse mapToAdminUserResponse(User user) {
        long count = 0;
        if (user.getFullName() != null) {
            count = documentRepository.countByUploadedBy(user.getFullName());
        }
        if (count == 0 && user.getEmail() != null) {
            count = documentRepository.countByUploadedBy(user.getEmail());
        }

        return AdminUserResponse.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .documentCount((int) count)
                .createdAt(user.getCreatedAt())
                .build();
    }
}

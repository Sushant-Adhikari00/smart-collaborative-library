package com.scl.modules.admin.service;

import com.scl.audit.entity.AuditLog;
import com.scl.audit.repository.AuditRepository;
import com.scl.common.PageResponse;
import com.scl.exception.ResourceNotFoundException;
import com.scl.modules.admin.dto.AdminUserResponse;
import com.scl.modules.admin.dto.AnalyticsResponse;
import com.scl.modules.auth.entity.Role;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
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
     * Force delete a document. (Stubbed — Document module not yet implemented)
     */
    @Transactional
    public void forceDeleteDocument(Long documentId) {
        log.warn("forceDeleteDocument called for documentId: {} — Document module not yet implemented", documentId);
        // TODO: Implement when Document module is created
        throw new UnsupportedOperationException("Document module not yet implemented");
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

        return AnalyticsResponse.builder()
                .totalUsers(totalUsers)
                .totalDocuments(0)                  // TODO: Wire when Document module exists
                .totalSummaries(0)                  // TODO: Wire when Summary module exists
                .totalChatMessages(0)               // TODO: Wire when Chat module exists
                .activeUsersToday(activeUsersToday)
                .documentsUploadedThisWeek(0)       // TODO: Wire when Document module exists
                .popularSubjects(Collections.emptyMap()) // TODO: Wire when Document module exists
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
        return AdminUserResponse.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .documentCount(0) // TODO: Wire when Document module exists
                .createdAt(user.getCreatedAt())
                .build();
    }
}

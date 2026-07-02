package com.scl.modules.admin.controller;

import com.scl.audit.entity.AuditLog;
import com.scl.common.ApiResponse;
import com.scl.common.PageResponse;
import com.scl.modules.admin.dto.AdminUserResponse;
import com.scl.modules.admin.dto.AnalyticsResponse;
import com.scl.modules.admin.dto.UpdateRoleRequest;
import com.scl.modules.admin.service.AdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin", description = "Admin endpoints for user management and analytics")
public class AdminController {

    private final AdminService adminService;

    @Operation(summary = "Get all users", description = "Retrieves a paginated list of all users")
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<PageResponse<AdminUserResponse>>> getAllUsers(Pageable pageable) {
        log.debug("GET /api/v1/admin/users");
        PageResponse<AdminUserResponse> users = adminService.getAllUsers(pageable);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @Operation(summary = "Update user role", description = "Updates the role of a specific user")
    @PutMapping("/users/{id}/role")
    public ResponseEntity<ApiResponse<Void>> updateUserRole(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoleRequest request) {
        log.debug("PUT /api/v1/admin/users/{}/role", id);
        adminService.updateUserRole(id, request.getRole());
        return ResponseEntity.ok(ApiResponse.success("User role updated successfully", null));
    }

    @Operation(summary = "Deactivate user", description = "Deactivates a user account")
    @PutMapping("/users/{id}/deactivate")
    public ResponseEntity<ApiResponse<Void>> deactivateUser(@PathVariable Long id) {
        log.debug("PUT /api/v1/admin/users/{}/deactivate", id);
        adminService.deactivateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deactivated successfully", null));
    }

    @Operation(summary = "Activate user", description = "Activates a user account")
    @PutMapping("/users/{id}/activate")
    public ResponseEntity<ApiResponse<Void>> activateUser(@PathVariable Long id) {
        log.debug("PUT /api/v1/admin/users/{}/activate", id);
        adminService.activateUser(id);
        return ResponseEntity.ok(ApiResponse.success("User activated successfully", null));
    }

    @Operation(summary = "Force delete document", description = "Forcefully deletes a document by ID")
    @DeleteMapping("/documents/{id}")
    public ResponseEntity<ApiResponse<Void>> forceDeleteDocument(@PathVariable Long id) {
        log.debug("DELETE /api/v1/admin/documents/{}", id);
        adminService.forceDeleteDocument(id);
        return ResponseEntity.ok(ApiResponse.success("Document force deleted successfully", null));
    }

    @Operation(summary = "Get analytics", description = "Retrieves platform analytics dashboard data")
    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsResponse>> getAnalytics() {
        log.debug("GET /api/v1/admin/analytics");
        AnalyticsResponse analytics = adminService.getAnalytics();
        return ResponseEntity.ok(ApiResponse.success(analytics));
    }

    @Operation(summary = "Get audit logs", description = "Retrieves a paginated list of audit logs")
    @GetMapping("/audit-logs")
    public ResponseEntity<ApiResponse<PageResponse<AuditLog>>> getAuditLogs(Pageable pageable) {
        log.debug("GET /api/v1/admin/audit-logs");
        PageResponse<AuditLog> auditLogs = adminService.getAuditLogs(pageable);
        return ResponseEntity.ok(ApiResponse.success(auditLogs));
    }
}

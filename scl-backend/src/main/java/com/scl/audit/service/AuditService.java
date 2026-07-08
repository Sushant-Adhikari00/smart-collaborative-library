package com.scl.audit.service;

import com.scl.audit.entity.AuditLog;
import com.scl.audit.repository.AuditRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditRepository auditRepository;

    @Async("taskExecutor")
    public void log(Long userId, String action, String resourceType, String resourceId,
                    String details, HttpServletRequest request) {
        try {
            String ipAddress = extractIpAddress(request);
            String userAgent = request.getHeader("User-Agent");

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent != null ? userAgent.substring(0, Math.min(userAgent.length(), 1000)) : null)
                    .details(details)
                    .build();

            auditRepository.save(auditLog);
            log.debug("Audit log saved: action={}, userId={}, resourceType={}, resourceId={}",
                    action, userId, resourceType, resourceId);
        } catch (Exception ex) {
            log.error("Failed to save audit log: action={}, userId={}, error={}", action, userId, ex.getMessage(), ex);
        }
    }

    private String extractIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

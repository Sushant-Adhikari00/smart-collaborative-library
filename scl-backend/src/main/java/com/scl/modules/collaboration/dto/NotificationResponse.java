package com.scl.modules.collaboration.dto;

import com.scl.modules.collaboration.entity.NotificationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private NotificationType notificationType;
    private String targetUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;
}

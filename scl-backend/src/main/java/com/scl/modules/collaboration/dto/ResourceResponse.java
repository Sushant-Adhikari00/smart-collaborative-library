package com.scl.modules.collaboration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {
    private Long id;
    private Long groupId;
    private Long uploaderId;
    private String uploaderName;
    private String uploaderRole;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private Boolean isVerified;
    private Boolean isPinned;
    private String aiSummary;
    private String aiKeyPoints;
    private String aiKeywords;
    private Long commentCount;
    private LocalDateTime uploadedAt;
}

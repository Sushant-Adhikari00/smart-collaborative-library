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
public class DocumentResourceResponse {
    private Long id;
    private Long documentId;
    private Long uploaderId;
    private String uploaderName;
    private String uploaderRole;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private String aiSummary;
    private String aiKeyPoints;
    private String aiKeywords;
    private LocalDateTime uploadedAt;
}

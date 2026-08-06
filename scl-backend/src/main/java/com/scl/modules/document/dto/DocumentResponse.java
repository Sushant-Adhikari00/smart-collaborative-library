package com.scl.modules.document.dto;


import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DocumentResponse {
    private Long id;
    private String title;
    private String description;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadDate;
    private String uploadedBy;
    private String categoryName;
    private String status;
    
    // --- AI Fields ---
    private String aiSummary;
    private String extractedText;
    private Integer chunksCount;
    private String aiKeyPoints;
    private String aiKeywords;

    private Long commentCount;
}

package com.scl.modules.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DocumentUploadRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "CategoryId is required")
    private Long categoryId;

    private String uploadedBy;
}

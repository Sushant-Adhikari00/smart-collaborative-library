package com.scl.scl_backend.modules.document.dto;

import com.drew.lang.annotations.NotNull;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentUploadRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull()
    private Long categoryId;

    private String uploadedBy;
}

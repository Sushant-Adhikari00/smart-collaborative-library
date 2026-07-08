package com.scl.modules.document.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DocumentShareRequest {
    @NotNull(message = "Document ID is required")
    private Long documentId;

    @NotNull(message = "User ID to share with is required")
    private Long sharedWithUserId;

    @NotBlank(message = "Permission is required (e.g., READ, EDIT)")
    private String permission;
}

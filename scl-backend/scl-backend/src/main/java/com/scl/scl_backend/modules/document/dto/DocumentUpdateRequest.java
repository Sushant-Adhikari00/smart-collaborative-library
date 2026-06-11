package com.scl.scl_backend.modules.document.dto;

import jakarta.validation.constraints.NotBlank;

public class DocumentUpdateRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Long categoryId;

    private String status;
}

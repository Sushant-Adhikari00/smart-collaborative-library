package com.scl.modules.document.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DocumentUpdateRequest {
    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    private Long categoryId;

    private String status;
}

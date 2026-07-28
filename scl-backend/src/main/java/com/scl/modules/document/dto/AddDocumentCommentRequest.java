package com.scl.modules.document.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AddDocumentCommentRequest {
    @NotBlank(message = "Comment content cannot be empty")
    private String content;
    private Long parentCommentId;
}

package com.scl.modules.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentCommentResponse {
    private Long id;
    private Long documentId;
    private Long authorId;
    private String authorName;
    private String authorProfilePicture;
    private String content;
    private Long parentCommentId;
    private List<DocumentCommentResponse> replies;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

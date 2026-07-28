package com.scl.modules.collaboration.dto;

import com.scl.modules.collaboration.entity.CollaborationRequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CollaborationRequestResponse {
    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterEmail;
    private Long documentId;
    private String documentTitle;
    private Long ownerId;
    private String ownerEmail;
    private String message;
    private CollaborationRequestStatus status;
    private LocalDateTime createdAt;
}

package com.scl.modules.collaboration.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "collaboration_requests")
public class CollaborationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user who sent the collaboration request */
    @Column(name = "requester_id", nullable = false)
    private Long requesterId;

    @Column(name = "requester_name", nullable = false, length = 255)
    private String requesterName;

    @Column(name = "requester_email", nullable = false, length = 255)
    private String requesterEmail;

    /** The document they want to collaborate on */
    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "document_title", length = 255)
    private String documentTitle;

    /** The document owner who receives the request */
    @Column(name = "owner_id")
    private Long ownerId;

    @Column(name = "owner_email", nullable = false, length = 255)
    private String ownerEmail;

    /** Optional message from the requester */
    @Column(columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private CollaborationRequestStatus status = CollaborationRequestStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}

package com.scl.modules.document.entity;

import com.scl.modules.auth.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "document_shares")
@EntityListeners(AuditingEntityListener.class)
public class DocumentShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_with_user_id", nullable = false)
    private User sharedWith;

    @Column(nullable = false, length = 50)
    private String permission; // e.g., "READ", "EDIT"

    @CreatedDate
    @Column(name = "shared_at", updatable = false)
    private LocalDateTime sharedAt;
}

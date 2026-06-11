package com.scl.scl_backend.modules.document.entity;

import jakarta.persistence.*;
import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import javax.swing.event.DocumentListener;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name ="documents")
@EntityListeners(AuditingEntityListener.class)
public class Document {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "file_type", nullable = false, length = 100)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;           // in bytes

    @CreatedDate
    @Column(name = "upload_date", updatable = false)
    private LocalDateTime uploadDate;

    @Column(name = "uploaded_by", nullable = false)
    private String uploadedBy;       // You can change to User entity later

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private DocumentStatus status;

}

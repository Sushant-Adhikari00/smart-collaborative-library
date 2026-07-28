package com.scl.modules.document.repository;

import com.scl.modules.document.entity.DocumentComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {
    List<DocumentComment> findByDocumentIdAndParentCommentIsNullOrderByCreatedAtAsc(Long documentId);
    long countByDocumentId(Long documentId);
}

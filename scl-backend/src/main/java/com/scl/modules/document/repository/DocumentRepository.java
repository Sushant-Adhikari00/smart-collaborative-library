package com.scl.modules.document.repository;

import com.scl.modules.document.entity.Document;
import com.scl.modules.document.entity.DocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document,Long> {

    List<Document> findByUploadedBy(String uploadedBy);

    // Document.category is a Category entity, so JPA needs "Category_Id" or "Category.Id"
    List<Document> findByCategory_Id(Integer categoryId);

    // FIX: Document.status is a DocumentStatus enum, not a String.
    // Passing a String here would fail at startup with a PropertyReferenceException.
    List<Document> findByStatus(DocumentStatus status);

    long countByUploadDateAfter(java.time.LocalDateTime date);

    long countByUploadedBy(String uploadedBy);
}

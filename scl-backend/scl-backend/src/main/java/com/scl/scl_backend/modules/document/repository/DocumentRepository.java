package com.scl.scl_backend.modules.document.repository;

import com.scl.scl_backend.modules.document.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document,Long> {

    List<Document> findByUploadedBy(String uploadedBy);

    List<Document> findByCategoryId(Long categoryId);

    List<Document> findByStatus(String status);
}

package com.scl.modules.collaboration.repository;

import com.scl.modules.collaboration.entity.DocumentResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentResourceRepository extends JpaRepository<DocumentResource, Long> {
    List<DocumentResource> findByDocumentIdOrderByUploadedAtDesc(Long documentId);
}

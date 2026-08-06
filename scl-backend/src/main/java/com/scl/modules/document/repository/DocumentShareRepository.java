package com.scl.modules.document.repository;

import com.scl.modules.document.entity.DocumentShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentShareRepository extends JpaRepository<DocumentShare, Long> {
    List<DocumentShare> findByDocument_Id(Integer documentId);
    List<DocumentShare> findBySharedWith_Id(Long userId);
    boolean existsByDocument_IdAndSharedWith_Id(Integer documentId, Long userId);
    void deleteByDocument_Id(Integer documentId);
}

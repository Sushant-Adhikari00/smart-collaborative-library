package com.scl.modules.document.repository;

import com.scl.modules.document.entity.DocumentRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DocumentRatingRepository extends JpaRepository<DocumentRating, Long> {
    Optional<DocumentRating> findByDocumentIdAndUserId(Long documentId, Long userId);

    @Query("SELECT COALESCE(AVG(CAST(r.rating AS double)), 0.0) FROM DocumentRating r WHERE r.document.id = :documentId")
    Double getAverageRatingByDocumentId(@Param("documentId") Long documentId);

    long countByDocumentId(Long documentId);

    void deleteByDocumentId(Long documentId);
}

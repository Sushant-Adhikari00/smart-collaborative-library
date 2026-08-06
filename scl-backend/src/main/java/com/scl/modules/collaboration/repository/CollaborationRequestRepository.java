package com.scl.modules.collaboration.repository;

import com.scl.modules.collaboration.entity.CollaborationRequest;
import com.scl.modules.collaboration.entity.CollaborationRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CollaborationRequestRepository extends JpaRepository<CollaborationRequest, Long> {

    /** Count how many requests this user has sent for a specific document */
    long countByDocumentIdAndRequesterId(Long documentId, Long requesterId);

    /** All pending requests for a document owner */
    List<CollaborationRequest> findByOwnerIdAndStatus(Long ownerId, CollaborationRequestStatus status);

    /** All requests for a document owner regardless of status */
    List<CollaborationRequest> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    /** Check if a specific request already exists */
    boolean existsByDocumentIdAndRequesterIdAndStatus(Long documentId, Long requesterId, CollaborationRequestStatus status);

    /** All requests for a specific document by status */
    List<CollaborationRequest> findByDocumentIdAndStatus(Long documentId, CollaborationRequestStatus status);

    void deleteByDocumentId(Long documentId);
}

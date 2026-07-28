package com.scl.modules.collaboration.repository;

import com.scl.modules.collaboration.entity.ResourceComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResourceCommentRepository extends JpaRepository<ResourceComment, Long> {

    List<ResourceComment> findByResourceIdAndParentCommentIsNullOrderByCreatedAtAsc(Long resourceId);

    long countByResourceId(Long resourceId);
}

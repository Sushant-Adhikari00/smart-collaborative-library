package com.scl.modules.collaboration.repository;

import com.scl.modules.collaboration.entity.GroupResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupResourceRepository extends JpaRepository<GroupResource, Long> {

    List<GroupResource> findByGroupIdOrderByUploadedAtDesc(Long groupId);

    List<GroupResource> findByGroupIdAndIsVerifiedTrueOrderByUploadedAtDesc(Long groupId);

    List<GroupResource> findByGroupIdAndIsPinnedTrueOrderByUploadedAtDesc(Long groupId);

    long countByGroupId(Long groupId);

    @Query("SELECT r FROM GroupResource r JOIN r.group g JOIN g.members m WHERE m.user.id = :userId ORDER BY r.uploadedAt DESC")
    List<GroupResource> findRecentResourcesByUserId(@Param("userId") Long userId);
}

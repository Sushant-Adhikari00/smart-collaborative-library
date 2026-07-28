package com.scl.modules.collaboration.repository;

import com.scl.modules.collaboration.entity.CollaborationGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollaborationGroupRepository extends JpaRepository<CollaborationGroup, Long> {

    Optional<CollaborationGroup> findByInviteCode(String inviteCode);

    @Query("SELECT g FROM CollaborationGroup g JOIN g.members m WHERE m.user.id = :userId")
    List<CollaborationGroup> findAllByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(g) FROM CollaborationGroup g JOIN g.members m WHERE m.user.id = :userId")
    long countByUserId(@Param("userId") Long userId);
}

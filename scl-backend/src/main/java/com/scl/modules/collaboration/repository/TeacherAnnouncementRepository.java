package com.scl.modules.collaboration.repository;

import com.scl.modules.collaboration.entity.TeacherAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeacherAnnouncementRepository extends JpaRepository<TeacherAnnouncement, Long> {

    List<TeacherAnnouncement> findByGroupIdOrderByIsPinnedDescCreatedAtDesc(Long groupId);
}

package com.scl.modules.auth.repository;

import com.scl.modules.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByUuid(String uuid);

    long countByIsActiveTrue();

    @Query("SELECT COUNT(DISTINCT a.userId) FROM AuditLog a WHERE a.createdAt >= :since")
    long countActiveUsersSince(LocalDateTime since);

    Page<User> findAllByOrderByCreatedAtDesc(Pageable pageable);
}

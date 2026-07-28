package com.scl.modules.chat.repository;

import com.scl.modules.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    Optional<ChatRoom> findFirstByNameOrderByIdAsc(String name);
    Optional<ChatRoom> findByGroupId(Long groupId);
}

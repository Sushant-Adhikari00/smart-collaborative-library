package com.scl.modules.chat.repository;

import com.scl.modules.chat.entity.ChatRoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomMemberRepository extends JpaRepository<ChatRoomMember, Long> {

    boolean existsByRoomIdAndUserId(Long roomId, Long userId);

    List<ChatRoomMember> findByRoomId(Long roomId);

    List<ChatRoomMember> findByUserId(Long userId);

    Optional<ChatRoomMember> findByRoomIdAndUserId(Long roomId, Long userId);
}

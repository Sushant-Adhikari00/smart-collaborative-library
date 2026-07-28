package com.scl.modules.collaboration.dto;

import com.scl.modules.collaboration.entity.GroupRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GroupMemberResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String profilePicture;
    private String userRole; // STUDENT, TEACHER, ADMIN
    private GroupRole groupRole; // OWNER, MODERATOR, MEMBER
    private LocalDateTime joinedAt;
}

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
public class GroupResponse {
    private Long id;
    private String name;
    private String description;
    private String inviteCode;
    private Long ownerId;
    private String ownerName;
    private GroupRole currentUserRole;
    private Long memberCount;
    private Long resourceCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

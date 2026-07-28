package com.scl.modules.collaboration.dto;

import com.scl.modules.collaboration.entity.GroupRole;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateMemberRoleRequest {
    @NotNull(message = "Group role is required")
    private GroupRole role;
}

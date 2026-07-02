package com.scl.modules.auth.dto;

import com.scl.modules.auth.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String uuid;
    private String email;
    private String fullName;
    private Role role;
    private String profilePicture;
}

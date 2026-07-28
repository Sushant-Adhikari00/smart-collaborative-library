package com.scl.modules.chat.dto;

import com.scl.modules.auth.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomDTO {
    private Long id;
    private String name;
    private UserDTO createdBy;
    private LocalDateTime createdAt;
}

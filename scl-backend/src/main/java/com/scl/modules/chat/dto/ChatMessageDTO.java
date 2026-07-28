package com.scl.modules.chat.dto;

import com.scl.modules.auth.dto.UserDTO;
import com.scl.modules.chat.entity.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private Long roomId;
    private UserDTO sender;
    private String message;
    private MessageType messageType;
    private LocalDateTime createdAt;
}

package com.scl.modules.chat.dto;

import com.scl.modules.chat.entity.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageSendRequest {
    @NotNull(message = "Room ID is required")
    private Long roomId;

    @NotBlank(message = "Message content cannot be blank")
    private String message;

    private MessageType messageType; // Can be null, defaults to TEXT
}

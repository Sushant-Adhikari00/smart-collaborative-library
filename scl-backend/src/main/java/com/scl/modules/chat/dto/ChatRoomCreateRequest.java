package com.scl.modules.chat.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatRoomCreateRequest {
    @NotBlank(message = "Room name cannot be blank")
    @Size(max = 100, message = "Room name cannot exceed 100 characters")
    private String name;
}

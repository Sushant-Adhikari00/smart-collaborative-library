package com.scl.modules.ai.dto;

import lombok.Data;

@Data
public class AiChatRequest {
    private String question;
    private String documentId;
}

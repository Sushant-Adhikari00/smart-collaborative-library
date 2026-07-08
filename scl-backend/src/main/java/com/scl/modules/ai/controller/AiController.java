package com.scl.modules.ai.controller;

import com.scl.modules.ai.dto.AiChatRequest;
import com.scl.modules.ai.dto.AiChatResponse;
import com.scl.modules.ai.service.AiServiceClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/ai")
public class AiController {

    private final AiServiceClient aiServiceClient;

    public AiController(AiServiceClient aiServiceClient) {
        this.aiServiceClient = aiServiceClient;
    }

    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@RequestBody AiChatRequest request) {
        AiChatResponse response = aiServiceClient.chat(request.getQuestion());
        return ResponseEntity.ok(response);
    }
}

package com.scl.modules.chat.controller;

import com.scl.modules.chat.dto.ChatMessageSendRequest;
import com.scl.modules.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;

    @MessageMapping("/chat.send")
    public void handleMessage(@Payload @Valid ChatMessageSendRequest request, Principal principal) {
        if (principal == null) {
            log.warn("Received chat.send request from unauthenticated WebSocket session.");
            return;
        }
        String senderEmail = principal.getName();
        log.debug("WebSocket message received from {}: {}", senderEmail, request.getMessage());
        
        chatService.saveAndBroadcastMessage(request, senderEmail);
    }
}

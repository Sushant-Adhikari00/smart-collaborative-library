package com.scl.modules.chat.controller;

import com.scl.common.ApiResponse;
import com.scl.common.PageResponse;
import com.scl.modules.chat.dto.ChatMessageDTO;
import com.scl.modules.chat.dto.ChatMessageSendRequest;
import com.scl.modules.chat.dto.ChatRoomCreateRequest;
import com.scl.modules.chat.dto.ChatRoomDTO;
import com.scl.modules.chat.dto.ChatRoomMemberDTO;
import com.scl.modules.chat.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/chat/rooms")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<ApiResponse<ChatRoomDTO>> createRoom(
            @Valid @RequestBody ChatRoomCreateRequest request,
            Authentication authentication) {
        log.info("REST request to create chat room: {}", request.getName());
        ChatRoomDTO response = chatService.createRoom(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Chat room created successfully", response));
    }

    @PostMapping("/{roomId}/join")
    public ResponseEntity<ApiResponse<ChatRoomMemberDTO>> joinRoom(
            @PathVariable Long roomId,
            Authentication authentication) {
        log.info("REST request to join room: {}", roomId);
        ChatRoomMemberDTO response = chatService.joinRoom(roomId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Successfully joined the chat room", response));
    }

    @GetMapping("/{roomId}")
    public ResponseEntity<ApiResponse<ChatRoomDTO>> getRoomDetails(
            @PathVariable Long roomId,
            Authentication authentication) {
        log.debug("REST request to get details for room: {}", roomId);
        ChatRoomDTO response = chatService.getRoomDetails(roomId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Fetched room details", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ChatRoomDTO>>> listRooms(Authentication authentication) {
        log.debug("REST request to list chat rooms");
        List<ChatRoomDTO> response = chatService.listRooms(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Fetched user's chat rooms", response));
    }

    @GetMapping("/{roomId}/messages")
    public ResponseEntity<ApiResponse<PageResponse<ChatMessageDTO>>> getPreviousMessages(
            @PathVariable Long roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            Authentication authentication) {
        log.debug("REST request to get messages for room: {}, page: {}, size: {}", roomId, page, size);
        PageResponse<ChatMessageDTO> response = chatService.getPreviousMessages(
                roomId, authentication.getName(), page, size);
        return ResponseEntity.ok(ApiResponse.success("Fetched previous messages", response));
    }

    @PostMapping("/{roomId}/messages")
    public ResponseEntity<ApiResponse<ChatMessageDTO>> sendMessage(
            @PathVariable Long roomId,
            @Valid @RequestBody ChatMessageSendRequest request,
            Authentication authentication) {
        log.info("REST request to send message to room: {}", roomId);
        // Ensure roomId from path matches the request body
        request.setRoomId(roomId);
        ChatMessageDTO response = chatService.saveAndBroadcastMessage(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Message sent successfully", response));
    }
}

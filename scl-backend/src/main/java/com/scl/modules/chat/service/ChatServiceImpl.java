package com.scl.modules.chat.service;

import com.scl.common.PageResponse;
import com.scl.exception.ResourceNotFoundException;
import com.scl.exception.UnauthorizedException;
import com.scl.modules.auth.dto.UserDTO;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.chat.dto.*;
import com.scl.modules.chat.entity.ChatMessage;
import com.scl.modules.chat.entity.ChatRoom;
import com.scl.modules.chat.entity.ChatRoomMember;
import com.scl.modules.chat.entity.MessageType;
import com.scl.modules.chat.repository.ChatMessageRepository;
import com.scl.modules.chat.repository.ChatRoomMemberRepository;
import com.scl.modules.chat.repository.ChatRoomRepository;
import com.scl.modules.ai.service.AiServiceClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatRoomMemberRepository chatRoomMemberRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AiServiceClient aiServiceClient;

    @Override
    @Transactional
    public ChatRoomDTO createRoom(ChatRoomCreateRequest request, String creatorEmail) {
        log.info("Creating or fetching chat room: {} by user: {}", request.getName(), creatorEmail);
        User creator = getUserByEmail(creatorEmail);

        // Check if room with this name already exists (e.g. doc-5)
        java.util.Optional<ChatRoom> existingRoom = chatRoomRepository.findFirstByNameOrderByIdAsc(request.getName());
        if (existingRoom.isPresent()) {
            ChatRoom room = existingRoom.get();
            // Ensure the user is a member of the room
            if (!chatRoomMemberRepository.existsByRoomIdAndUserId(room.getId(), creator.getId())) {
                ChatRoomMember member = ChatRoomMember.builder()
                        .room(room)
                        .user(creator)
                        .build();
                chatRoomMemberRepository.save(member);
            }
            return mapToChatRoomDTO(room);
        }

        ChatRoom room = ChatRoom.builder()
                .name(request.getName())
                .createdBy(creator)
                .build();

        ChatRoom savedRoom = chatRoomRepository.save(room);

        // Auto-join the creator to the room
        ChatRoomMember member = ChatRoomMember.builder()
                .room(savedRoom)
                .user(creator)
                .build();
        chatRoomMemberRepository.save(member);

        return mapToChatRoomDTO(savedRoom);
    }

    @Override
    @Transactional
    public ChatRoomMemberDTO joinRoom(Long roomId, String userEmail) {
        log.info("User: {} joining room: {}", userEmail, roomId);
        ChatRoom room = getRoomById(roomId);
        User user = getUserByEmail(userEmail);

        // Check if user is already a member
        return chatRoomMemberRepository.findByRoomIdAndUserId(roomId, user.getId())
                .map(this::mapToChatRoomMemberDTO)
                .orElseGet(() -> {
                    ChatRoomMember member = ChatRoomMember.builder()
                            .room(room)
                            .user(user)
                            .build();
                    ChatRoomMember savedMember = chatRoomMemberRepository.save(member);
                    return mapToChatRoomMemberDTO(savedMember);
                });
    }

    @Override
    @Transactional
    public ChatRoomDTO getRoomDetails(Long roomId, String userEmail) {
        log.debug("Fetching room details: {} for user: {}", roomId, userEmail);
        ChatRoom room = getRoomById(roomId);
        User user = getUserByEmail(userEmail);

        // Ensure membership
        ensureMembership(roomId, user);

        return mapToChatRoomDTO(room);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatRoomDTO> listRooms(String userEmail) {
        log.debug("Listing chat rooms for user: {}", userEmail);
        User user = getUserByEmail(userEmail);

        List<ChatRoomMember> memberships = chatRoomMemberRepository.findByUserId(user.getId());
        return memberships.stream()
                .map(member -> mapToChatRoomDTO(member.getRoom()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PageResponse<ChatMessageDTO> getPreviousMessages(Long roomId, String userEmail, int page, int size) {
        log.debug("Fetching previous messages for room: {}, page: {}, size: {}", roomId, page, size);
        ChatRoom room = getRoomById(roomId);
        User user = getUserByEmail(userEmail);

        // Ensure membership
        ensureMembership(roomId, user);

        Pageable pageable = PageRequest.of(page, size);
        Page<ChatMessage> messagePage = chatMessageRepository.findByRoomIdOrderByCreatedAtDesc(roomId, pageable);

        Page<ChatMessageDTO> dtoPage = messagePage.map(this::mapToChatMessageDTO);
        return PageResponse.from(dtoPage);
    }

    @Override
    @Transactional
    public ChatMessageDTO saveAndBroadcastMessage(ChatMessageSendRequest request, String senderEmail) {
        log.info("Sending message to room: {} by user: {}", request.getRoomId(), senderEmail);
        ChatRoom room = getRoomById(request.getRoomId());
        User sender = getUserByEmail(senderEmail);

        // Ensure membership
        ensureMembership(request.getRoomId(), sender);

        MessageType messageType = request.getMessageType() != null ? request.getMessageType() : MessageType.TEXT;

        ChatMessage message = ChatMessage.builder()
                .room(room)
                .sender(sender)
                .message(request.getMessage())
                .messageType(messageType)
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        ChatMessageDTO dto = mapToChatMessageDTO(savedMessage);

        // Broadcast to WebSocket subscribers: /topic/chat/{roomId}
        String destination = "/topic/chat/" + request.getRoomId();
        messagingTemplate.convertAndSend(destination, dto);

        // Handle @AI mention in chat message
        if (request.getMessage() != null && request.getMessage().trim().toLowerCase().startsWith("@ai")) {
            processAiChatMessageAsync(request.getMessage(), room, destination);
        }

        return dto;
    }

    private void processAiChatMessageAsync(String fullMessage, ChatRoom room, String destination) {
        new Thread(() -> {
            try {
                String question = fullMessage.substring(fullMessage.toLowerCase().indexOf("@ai") + 3).trim();
                if (question.isBlank()) {
                    question = "Hello! How can I assist you with your study group resources?";
                }

                // Retrieve AI User bot account or create transient system user
                User aiUser = userRepository.findByEmail("ai.bot@scl.edu")
                        .orElseGet(() -> userRepository.save(User.builder()
                                .email("ai.bot@scl.edu")
                                .fullName("AI Assistant")
                                .passwordHash("N/A")
                                .role(com.scl.modules.auth.entity.Role.ADMIN)
                                .profilePicture("https://api.dicebear.com/7.x/bottts/svg?seed=scl-ai")
                                .isActive(true)
                                .build()));

                var aiResponse = aiServiceClient.chat(question, room.getId().toString());
                String aiAnswer = aiResponse != null && aiResponse.getAnswer() != null ?
                        aiResponse.getAnswer() : "I couldn't process your request at the moment.";

                ChatMessage aiMessage = ChatMessage.builder()
                        .room(room)
                        .sender(aiUser)
                        .message(aiAnswer)
                        .messageType(MessageType.TEXT)
                        .build();

                ChatMessage savedAiMsg = chatMessageRepository.save(aiMessage);
                ChatMessageDTO aiDto = mapToChatMessageDTO(savedAiMsg);

                messagingTemplate.convertAndSend(destination, aiDto);
            } catch (Exception e) {
                log.error("Failed to generate and broadcast @AI chat response: {}", e.getMessage(), e);
            }
        }).start();
    }

    // ---- Private Helper Methods ----

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private ChatRoom getRoomById(Long roomId) {
        return chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatRoom", "id", roomId));
    }

    private void ensureMembership(Long roomId, User user) {
        if (!chatRoomMemberRepository.existsByRoomIdAndUserId(roomId, user.getId())) {
            try {
                ChatRoom room = getRoomById(roomId);
                ChatRoomMember member = ChatRoomMember.builder()
                        .room(room)
                        .user(user)
                        .build();
                chatRoomMemberRepository.save(member);
            } catch (Exception e) {
                log.debug("User {} already joined or concurrent join: {}", user.getEmail(), e.getMessage());
            }
        }
    }

    private UserDTO mapToUserDTO(User user) {
        if (user == null) return null;
        return UserDTO.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    private ChatRoomDTO mapToChatRoomDTO(ChatRoom room) {
        if (room == null) return null;
        return ChatRoomDTO.builder()
                .id(room.getId())
                .name(room.getName())
                .createdBy(mapToUserDTO(room.getCreatedBy()))
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatRoomMemberDTO mapToChatRoomMemberDTO(ChatRoomMember member) {
        if (member == null) return null;
        return ChatRoomMemberDTO.builder()
                .id(member.getId())
                .roomId(member.getRoom().getId())
                .user(mapToUserDTO(member.getUser()))
                .joinedAt(member.getJoinedAt())
                .build();
    }

    private ChatMessageDTO mapToChatMessageDTO(ChatMessage msg) {
        if (msg == null) return null;
        return ChatMessageDTO.builder()
                .id(msg.getId())
                .roomId(msg.getRoom().getId())
                .sender(mapToUserDTO(msg.getSender()))
                .message(msg.getMessage())
                .messageType(msg.getMessageType())
                .createdAt(msg.getCreatedAt())
                .build();
    }
}

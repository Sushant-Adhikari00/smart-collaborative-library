package com.scl.modules.chat.service;

import com.scl.common.PageResponse;
import com.scl.modules.chat.dto.*;

import java.util.List;

public interface ChatService {

    ChatRoomDTO createRoom(ChatRoomCreateRequest request, String creatorEmail);

    ChatRoomMemberDTO joinRoom(Long roomId, String userEmail);

    ChatRoomDTO getRoomDetails(Long roomId, String userEmail);

    List<ChatRoomDTO> listRooms(String userEmail);

    PageResponse<ChatMessageDTO> getPreviousMessages(Long roomId, String userEmail, int page, int size);

    ChatMessageDTO saveAndBroadcastMessage(ChatMessageSendRequest request, String senderEmail);
}

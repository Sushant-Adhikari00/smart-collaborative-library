package com.scl.modules.collaboration.service;

import com.scl.modules.auth.entity.User;

import com.scl.modules.chat.entity.ChatRoom;
import com.scl.modules.chat.repository.ChatRoomRepository;
import com.scl.modules.collaboration.dto.*;
import com.scl.modules.collaboration.entity.*;
import com.scl.modules.collaboration.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CollaborationGroupService {

    private final CollaborationGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final GroupResourceRepository resourceRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final NotificationService notificationService;

    @Transactional
    public GroupResponse createGroup(CreateGroupRequest request, User owner) {
        CollaborationGroup group = CollaborationGroup.builder()
                .name(request.getName())
                .description(request.getDescription())
                .owner(owner)
                .build();

        group = groupRepository.save(group);

        // Add owner as member with OWNER role
        GroupMember ownerMember = GroupMember.builder()
                .group(group)
                .user(owner)
                .groupRole(GroupRole.OWNER)
                .build();
        memberRepository.save(ownerMember);

        // Create default ChatRoom for group
        ChatRoom chatRoom = ChatRoom.builder()
                .name(group.getName() + " Chat")
                .group(group)
                .createdBy(owner)
                .build();
        chatRoomRepository.save(chatRoom);

        return mapToGroupResponse(group, owner);
    }

    @Transactional(readOnly = true)
    public List<GroupResponse> getUserGroups(User user) {
        return groupRepository.findAllByUserId(user.getId())
                .stream()
                .map(group -> mapToGroupResponse(group, user))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public GroupResponse getGroupById(Long groupId, User user) {
        CollaborationGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Study group not found with id: " + groupId));

        validateMembership(groupId, user.getId());

        return mapToGroupResponse(group, user);
    }

    @Transactional
    public GroupResponse updateGroup(Long groupId, UpdateGroupRequest request, User user) {
        CollaborationGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Study group not found"));

        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this group"));

        if (member.getGroupRole() != GroupRole.OWNER && member.getGroupRole() != GroupRole.MODERATOR) {
            throw new RuntimeException("Only Owners and Moderators can update group details");
        }

        if (request.getName() != null && !request.getName().isBlank()) {
            group.setName(request.getName());
        }
        if (request.getDescription() != null) {
            group.setDescription(request.getDescription());
        }

        CollaborationGroup updated = groupRepository.save(group);
        return mapToGroupResponse(updated, user);
    }

    @Transactional
    public void deleteGroup(Long groupId, User user) {
        CollaborationGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Study group not found"));

        if (!group.getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Only the Group Owner can delete this group");
        }

        groupRepository.delete(group);
    }

    @Transactional
    public GroupResponse joinGroupByInviteCode(JoinGroupRequest request, User user) {
        CollaborationGroup group = groupRepository.findByInviteCode(request.getInviteCode())
                .orElseThrow(() -> new RuntimeException("Invalid invite code"));

        if (memberRepository.existsByGroupIdAndUserId(group.getId(), user.getId())) {
            return mapToGroupResponse(group, user);
        }

        GroupMember member = GroupMember.builder()
                .group(group)
                .user(user)
                .groupRole(GroupRole.MEMBER)
                .build();
        memberRepository.save(member);

        // Notify Group Owner
        notificationService.sendNotification(
                group.getOwner(),
                "New Member Joined",
                user.getFullName() + " joined your study group: " + group.getName(),
                NotificationType.MEMBER_JOINED,
                "/collaboration/groups/" + group.getId()
        );

        return mapToGroupResponse(group, user);
    }

    @Transactional
    public void leaveGroup(Long groupId, User user) {
        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, user.getId())
                .orElseThrow(() -> new RuntimeException("You are not a member of this group"));

        if (member.getGroupRole() == GroupRole.OWNER) {
            throw new RuntimeException("Group Owner cannot leave the group. Transfer ownership or delete group instead.");
        }

        memberRepository.delete(member);
    }

    @Transactional(readOnly = true)
    public List<GroupMemberResponse> getGroupMembers(Long groupId, User user) {
        validateMembership(groupId, user.getId());

        return memberRepository.findByGroupId(groupId)
                .stream()
                .map(this::mapToMemberResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public GroupMemberResponse updateMemberRole(Long groupId, Long targetUserId, GroupRole newRole, User currentUser) {
        GroupMember currentMember = memberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Access denied"));

        if (currentMember.getGroupRole() != GroupRole.OWNER) {
            throw new RuntimeException("Only the Group Owner can change member roles");
        }

        GroupMember targetMember = memberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Target member not found in group"));

        if (targetMember.getGroupRole() == GroupRole.OWNER) {
            throw new RuntimeException("Cannot change owner's role directly");
        }

        targetMember.setGroupRole(newRole);
        GroupMember updated = memberRepository.save(targetMember);
        return mapToMemberResponse(updated);
    }

    @Transactional
    public void removeMember(Long groupId, Long targetUserId, User currentUser) {
        GroupMember currentMember = memberRepository.findByGroupIdAndUserId(groupId, currentUser.getId())
                .orElseThrow(() -> new RuntimeException("Access denied"));

        if (currentMember.getGroupRole() != GroupRole.OWNER && currentMember.getGroupRole() != GroupRole.MODERATOR) {
            throw new RuntimeException("Only Owners and Moderators can remove members");
        }

        GroupMember targetMember = memberRepository.findByGroupIdAndUserId(groupId, targetUserId)
                .orElseThrow(() -> new RuntimeException("Target member not found"));

        if (targetMember.getGroupRole() == GroupRole.OWNER) {
            throw new RuntimeException("Cannot remove the Group Owner");
        }

        memberRepository.delete(targetMember);
    }

    public void validateMembership(Long groupId, Long userId) {
        if (!memberRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new RuntimeException("User is not a member of group " + groupId);
        }
    }

    private GroupResponse mapToGroupResponse(CollaborationGroup group, User user) {
        GroupMember member = memberRepository.findByGroupIdAndUserId(group.getId(), user.getId()).orElse(null);
        long memberCount = memberRepository.countByGroupId(group.getId());
        long resourceCount = resourceRepository.countByGroupId(group.getId());

        return GroupResponse.builder()
                .id(group.getId())
                .name(group.getName())
                .description(group.getDescription())
                .inviteCode(group.getInviteCode())
                .ownerId(group.getOwner().getId())
                .ownerName(group.getOwner().getFullName())
                .currentUserRole(member != null ? member.getGroupRole() : null)
                .memberCount(memberCount)
                .resourceCount(resourceCount)
                .createdAt(group.getCreatedAt())
                .updatedAt(group.getUpdatedAt())
                .build();
    }

    private GroupMemberResponse mapToMemberResponse(GroupMember member) {
        return GroupMemberResponse.builder()
                .id(member.getId())
                .userId(member.getUser().getId())
                .fullName(member.getUser().getFullName())
                .email(member.getUser().getEmail())
                .profilePicture(member.getUser().getProfilePicture())
                .userRole(member.getUser().getRole().name())
                .groupRole(member.getGroupRole())
                .joinedAt(member.getJoinedAt())
                .build();
    }
}

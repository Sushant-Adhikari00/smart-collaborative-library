package com.scl.modules.collaboration.service;

import com.scl.modules.auth.entity.Role;
import com.scl.modules.auth.entity.User;
import com.scl.modules.collaboration.dto.AnnouncementResponse;
import com.scl.modules.collaboration.dto.CreateAnnouncementRequest;
import com.scl.modules.collaboration.entity.*;
import com.scl.modules.collaboration.repository.CollaborationGroupRepository;
import com.scl.modules.collaboration.repository.GroupMemberRepository;
import com.scl.modules.collaboration.repository.TeacherAnnouncementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TeacherAnnouncementService {

    private final TeacherAnnouncementRepository announcementRepository;
    private final CollaborationGroupRepository groupRepository;
    private final GroupMemberRepository memberRepository;
    private final CollaborationGroupService groupService;
    private final NotificationService notificationService;

    @Transactional
    public AnnouncementResponse createAnnouncement(Long groupId, CreateAnnouncementRequest request, User author) {
        groupService.validateMembership(groupId, author.getId());

        GroupMember member = memberRepository.findByGroupIdAndUserId(groupId, author.getId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        boolean isTeacher = author.getRole() == Role.TEACHER || author.getRole() == Role.ADMIN;
        boolean isOwnerOrMod = member.getGroupRole() == GroupRole.OWNER || member.getGroupRole() == GroupRole.MODERATOR;

        if (!isTeacher && !isOwnerOrMod) {
            throw new RuntimeException("Only Teachers, Group Owners, or Moderators can make announcements");
        }

        CollaborationGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new RuntimeException("Group not found"));

        TeacherAnnouncement announcement = TeacherAnnouncement.builder()
                .group(group)
                .teacher(author)
                .title(request.getTitle())
                .content(request.getContent())
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : false)
                .build();

        TeacherAnnouncement saved = announcementRepository.save(announcement);

        // Send notifications to group members
        List<GroupMember> members = memberRepository.findByGroupId(groupId);
        for (GroupMember m : members) {
            if (!m.getUser().getId().equals(author.getId())) {
                notificationService.sendNotification(
                        m.getUser(),
                        "Announcement: " + saved.getTitle(),
                        saved.getContent(),
                        NotificationType.TEACHER_ANNOUNCEMENT,
                        "/collaboration/groups/" + groupId
                );
            }
        }

        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getGroupAnnouncements(Long groupId, User user) {
        groupService.validateMembership(groupId, user.getId());

        return announcementRepository.findByGroupIdOrderByIsPinnedDescCreatedAtDesc(groupId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private AnnouncementResponse mapToResponse(TeacherAnnouncement announcement) {
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .groupId(announcement.getGroup().getId())
                .teacherId(announcement.getTeacher().getId())
                .teacherName(announcement.getTeacher().getFullName())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .isPinned(announcement.getIsPinned())
                .createdAt(announcement.getCreatedAt())
                .build();
    }
}

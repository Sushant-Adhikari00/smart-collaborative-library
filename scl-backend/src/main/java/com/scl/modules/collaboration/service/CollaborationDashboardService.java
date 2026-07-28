package com.scl.modules.collaboration.service;

import com.scl.modules.auth.entity.User;
import com.scl.modules.collaboration.dto.DashboardResponse;
import com.scl.modules.collaboration.dto.GroupResponse;
import com.scl.modules.collaboration.dto.NotificationResponse;
import com.scl.modules.collaboration.dto.ResourceResponse;
import com.scl.modules.collaboration.repository.CollaborationGroupRepository;
import com.scl.modules.collaboration.repository.GroupResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CollaborationDashboardService {

    private final CollaborationGroupService groupService;
    private final GroupResourceRepository resourceRepository;
    private final GroupResourceService resourceService;
    private final NotificationService notificationService;
    private final CollaborationGroupRepository groupRepository;

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardData(User user) {
        List<GroupResponse> userGroups = groupService.getUserGroups(user);
        long activeGroupsCount = userGroups.size();

        List<ResourceResponse> recentResources = resourceRepository.findRecentResourcesByUserId(user.getId())
                .stream()
                .limit(5)
                .map(resourceService::mapToResponse)
                .collect(Collectors.toList());

        List<NotificationResponse> recentNotifications = notificationService.getUserNotifications(user.getId())
                .stream()
                .limit(5)
                .collect(Collectors.toList());

        long unreadNotifsCount = notificationService.getUnreadCount(user.getId());

        return DashboardResponse.builder()
                .totalActiveGroups(activeGroupsCount)
                .totalSharedResources(recentResources.size())
                .unreadNotificationsCount(unreadNotifsCount)
                .activeGroups(userGroups)
                .recentResources(recentResources)
                .recentNotifications(recentNotifications)
                .build();
    }
}

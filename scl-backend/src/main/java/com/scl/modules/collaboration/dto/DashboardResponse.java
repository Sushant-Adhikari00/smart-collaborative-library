package com.scl.modules.collaboration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private long totalActiveGroups;
    private long totalSharedResources;
    private long unreadNotificationsCount;
    private List<GroupResponse> activeGroups;
    private List<ResourceResponse> recentResources;
    private List<NotificationResponse> recentNotifications;
}

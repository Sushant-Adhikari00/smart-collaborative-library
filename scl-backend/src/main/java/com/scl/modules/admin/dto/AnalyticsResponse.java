package com.scl.modules.admin.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private long totalUsers;
    private long totalDocuments;
    private long totalSummaries;
    private long totalChatMessages;
    private long activeUsersToday;
    private long documentsUploadedThisWeek;
    private Map<String, Long> popularSubjects;
}

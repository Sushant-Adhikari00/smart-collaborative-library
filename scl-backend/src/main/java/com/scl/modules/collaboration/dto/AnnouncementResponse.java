package com.scl.modules.collaboration.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {
    private Long id;
    private Long groupId;
    private Long teacherId;
    private String teacherName;
    private String title;
    private String content;
    private Boolean isPinned;
    private LocalDateTime createdAt;
}

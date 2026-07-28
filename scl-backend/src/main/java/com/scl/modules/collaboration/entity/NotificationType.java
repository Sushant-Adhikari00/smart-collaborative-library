package com.scl.modules.collaboration.entity;

public enum NotificationType {
    COLLABORATION_REQUEST,   // A user is requesting access to collaborate on a document
    COLLABORATION_ACCEPTED,  // Owner accepted the collaboration request
    COLLABORATION_REJECTED,  // Owner rejected the collaboration request
    MEMBER_JOINED,
    MEMBER_LEFT,
    RESOURCE_UPLOADED,
    RESOURCE_VERIFIED,
    NEW_COMMENT,
    CHAT_MESSAGE,
    AI_SUMMARY_GENERATED,
    TEACHER_ANNOUNCEMENT
}

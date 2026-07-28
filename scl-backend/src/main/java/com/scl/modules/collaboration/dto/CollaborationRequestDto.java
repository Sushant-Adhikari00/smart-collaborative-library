package com.scl.modules.collaboration.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CollaborationRequestDto {
    private Long documentId;
    private String message;
}

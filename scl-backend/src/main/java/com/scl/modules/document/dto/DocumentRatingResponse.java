package com.scl.modules.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRatingResponse {
    private Long documentId;
    private Double averageRating;
    private Long totalRatings;
    private Integer userRating; // The current user's rating (null if not rated)
}

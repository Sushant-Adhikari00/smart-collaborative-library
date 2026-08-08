package com.scl.modules.recommendation.service;

import com.scl.common.ApiResponse;
import java.util.List;

public interface RecommendationService {
    ApiResponse<?> getRecommendations(String userEmail);
}

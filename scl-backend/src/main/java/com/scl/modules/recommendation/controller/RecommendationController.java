package com.scl.modules.recommendation.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.recommendation.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping
    public ResponseEntity<ApiResponse<?>> getRecommendations(Authentication authentication) {
        String email = null;
        if (authentication != null && authentication.isAuthenticated()) {
            email = authentication.getName();
        }
        ApiResponse<?> response = recommendationService.getRecommendations(email);
        return response.isSuccess()
                ? ResponseEntity.ok(response)
                : ResponseEntity.badRequest().body(response);
    }
}

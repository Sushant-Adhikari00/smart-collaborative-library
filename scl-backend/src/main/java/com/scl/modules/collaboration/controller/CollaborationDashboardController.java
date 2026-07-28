package com.scl.modules.collaboration.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.modules.collaboration.dto.DashboardResponse;
import com.scl.modules.collaboration.service.CollaborationDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/collaboration/dashboard", "/api/collaboration/dashboard"})
@RequiredArgsConstructor
public class CollaborationDashboardController {

    private final CollaborationDashboardService dashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardData(Authentication authentication) {
        User user = getAuthenticatedUser(authentication);
        DashboardResponse response = dashboardService.getDashboardData(user);
        return ResponseEntity.ok(ApiResponse.success("Fetched collaboration dashboard data", response));
    }

    private User getAuthenticatedUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + authentication.getName()));
    }
}

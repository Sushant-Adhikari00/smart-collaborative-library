package com.scl.modules.auth.controller;

import com.scl.common.ApiResponse;
import com.scl.modules.auth.dto.*;
import com.scl.modules.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Auth endpoints for register, login, refresh, logout")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Integer>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "If this email is registered, a reset code has been sent.",
                HttpStatus.OK.value(),
                null
        ));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Integer>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Password has been reset successfully.",
                HttpStatus.OK.value(),
                null
        ));
    }
    @Operation(summary = "Register a new user", description = "Creates a new user account and returns JWT tokens")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {
        log.debug("POST /api/v1/auth/register - email: {}", request.getEmail());
        AuthResponse response = authService.register(request, httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    @Operation(summary = "Login", description = "Authenticates a user and returns JWT tokens")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        log.debug("POST /api/v1/auth/login - email: {}", request.getEmail());
        AuthResponse response = authService.login(request, httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @Operation(summary = "Refresh tokens", description = "Generates new access and refresh tokens using a valid refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        log.debug("POST /api/v1/auth/refresh");
        AuthResponse response = authService.refresh(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @Operation(summary = "Logout", description = "Revokes the refresh token")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {
        log.debug("POST /api/v1/auth/logout");
        authService.logout(request.getRefreshToken(), httpRequest);
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }

    @Operation(summary = "Get current user", description = "Returns the currently authenticated user's details")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser(Authentication authentication) {
        log.debug("GET /api/v1/auth/me");
        UserDTO user = authService.getCurrentUser(authentication);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}

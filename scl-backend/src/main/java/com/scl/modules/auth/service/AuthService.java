package com.scl.modules.auth.service;

import com.scl.audit.service.AuditService;
import com.scl.exception.ResourceNotFoundException;
import com.scl.exception.UnauthorizedException;
import com.scl.modules.auth.dto.AuthResponse;
import com.scl.modules.auth.dto.LoginRequest;
import com.scl.modules.auth.dto.RegisterRequest;
import com.scl.modules.auth.dto.UserDTO;
import com.scl.modules.auth.entity.RefreshToken;
import com.scl.modules.auth.entity.User;
import com.scl.modules.auth.repository.RefreshTokenRepository;
import com.scl.modules.auth.repository.UserRepository;
import com.scl.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;

import com.scl.common.EmailService;
import com.scl.modules.auth.dto.ForgotPasswordRequest;
import com.scl.modules.auth.entity.PasswordResetOtp;
import com.scl.modules.auth.repository.PasswordResetOtpRepository;
import java.security.SecureRandom;
import java.util.List;


@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuditService auditService;

    /**
     * Register a new user.
     */
    @Transactional
    public AuthResponse register(RegisterRequest request, HttpServletRequest httpRequest) {
        log.debug("Registering user with email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName().trim())
                .role(request.getRole())
                .isActive(true)
                .build();

        user = userRepository.save(user);
        log.info("User registered successfully: {}", user.getEmail());

        AuthResponse authResponse = generateAuthResponse(user);

        saveRefreshTokenHash(authResponse.getRefreshToken(), user);

        auditService.log(user.getId(), "USER_REGISTER", "USER", user.getUuid(),
                "User registered with role: " + user.getRole(), httpRequest);

        return authResponse;
    }

    /**
     * Authenticate a user and return tokens.
     */
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        log.debug("Login attempt for email: {}", request.getEmail());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail().toLowerCase().trim(),
                        request.getPassword()
                )
        );

        User user = userRepository.findByEmail(request.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        AuthResponse authResponse = generateAuthResponse(user);

        saveRefreshTokenHash(authResponse.getRefreshToken(), user);

        auditService.log(user.getId(), "USER_LOGIN", "USER", user.getUuid(),
                "User logged in", httpRequest);

        log.info("User logged in successfully: {}", user.getEmail());
        return authResponse;
    }

    /**
     * Refresh access token using a valid refresh token.
     */
    @Transactional
    public AuthResponse refresh(String refreshToken) {
        log.debug("Refreshing tokens");

        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        String tokenHash = hashToken(refreshToken);
        RefreshToken storedToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Refresh token not found or revoked"));

        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(storedToken);
            throw new UnauthorizedException("Refresh token has expired");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        // Revoke old refresh token
        refreshTokenRepository.delete(storedToken);

        // Issue new token pair
        AuthResponse authResponse = generateAuthResponse(user);
        saveRefreshTokenHash(authResponse.getRefreshToken(), user);

        log.info("Tokens refreshed for user: {}", email);
        return authResponse;
    }

    /**
     * Logout by revoking the refresh token.
     */
    @Transactional
    public void logout(String refreshToken, HttpServletRequest httpRequest) {
        log.debug("Logging out user");

        String tokenHash = hashToken(refreshToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(token -> {
            refreshTokenRepository.delete(token);

            auditService.log(token.getUser().getId(), "USER_LOGOUT", "USER",
                    token.getUser().getUuid(), "User logged out", httpRequest);
        });

        log.info("User logged out successfully");
    }

    /**
     * Get the currently authenticated user's details.
     */
    @Transactional(readOnly = true)
    public UserDTO getCurrentUser(Authentication authentication) {
        String email = authentication.getName();
        log.debug("Fetching current user: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return mapToUserDTO(user);
    }

    /**
     * adding method for forget password feature .
     */
    private final PasswordResetOtpRepository otpRepository;
    private final EmailService emailService;

    private static final int OTP_EXPIRY_MINUTES = 10;

   // @Override
    public void forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail();

        // Don't reveal whether the email exists — respond the same way either way
        if (!userRepository.existsByEmail(email)) {
            return;
        }

        // Invalidate any previous unused OTPs for this email
        List<PasswordResetOtp> existingOtps = otpRepository.findByEmailAndUsedFalse(email);
        existingOtps.forEach(otp -> otp.setUsed(true));
        otpRepository.saveAll(existingOtps);

        // Generate a 6-digit OTP
        String otp = String.format("%06d", new SecureRandom().nextInt(1_000_000));

        PasswordResetOtp resetOtp = PasswordResetOtp.builder()
                .email(email)
                .otpHash(passwordEncoder.encode(otp))
                .expiryTime(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .used(false)
                .build();

        otpRepository.save(resetOtp);

        emailService.sendOtpEmail(email, otp);
    }


    // ---- Private helpers ----

    private AuthResponse generateAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessTokenFromEmail(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationInSeconds())
                .user(mapToUserDTO(user))
                .build();
    }

    private void saveRefreshTokenHash(String rawRefreshToken, User user) {
        String tokenHash = hashToken(rawRefreshToken);
        LocalDateTime expiresAt = jwtTokenProvider.getTokenExpiry(rawRefreshToken)
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .tokenHash(tokenHash)
                .user(user)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);
    }

    private UserDTO mapToUserDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .uuid(user.getUuid())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new RuntimeException("SHA-256 algorithm not found", ex);
        }
    }
}

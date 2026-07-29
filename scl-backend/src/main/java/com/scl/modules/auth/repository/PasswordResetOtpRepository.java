package com.scl.modules.auth.repository;


import com.scl.modules.auth.entity.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    // Latest unused OTP for an email — used during verification
    Optional<PasswordResetOtp> findTopByEmailAndUsedFalseOrderByCreatedAtDesc(String email);

    // Used to invalidate old OTPs when a new one is requested
    List<PasswordResetOtp> findByEmailAndUsedFalse(String email);
}

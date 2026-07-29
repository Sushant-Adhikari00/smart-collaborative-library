package com.scl.common;


import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("SCL - Password Reset Code");
        message.setText(
                "Your password reset code is: " + otp + "\n\n" +
                        "This code will expire in 10 minutes. If you did not request this, " +
                        "you can safely ignore this email."
        );
        mailSender.send(message);
    }
}

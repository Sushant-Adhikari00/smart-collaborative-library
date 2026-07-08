package com.scl.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "jwt")
public class JwtConfig {

    private String secret;

    /**
     * Access token expiration in milliseconds (default: 15 minutes)
     */
    private long accessTokenExpiration = 900000;

    /**
     * Refresh token expiration in milliseconds (default: 7 days)
     */
    private long refreshTokenExpiration = 604800000;
}

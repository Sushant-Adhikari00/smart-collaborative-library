package com.scl.config;

import org.springframework.context.annotation.Configuration;

@Configuration
public class WebSocketSecurityConfig {
    // WebSocket security is integrated with the main HTTP Security filter chain.
    // The initial handshake is intercepted by JwtHandshakeInterceptor, which validates
    // the JWT and populates the authenticated User Principal.
    // Further message-level authorization checks (e.g., room membership) are handled
    // programmatically in the Service layer to provide granular validation and return
    // descriptive errors.
}

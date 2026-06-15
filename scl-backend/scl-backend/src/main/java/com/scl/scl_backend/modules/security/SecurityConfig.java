package com.scl.scl_backend.modules.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.web.SecurityFilterChain;

/**
 * TEMPORARY development security config.
 *
 * This disables auth entirely for Swagger and the document API so you can
 * test endpoints without a login screen. Once the auth/ module (JWT login,
 * register) is built, REPLACE this with a real SecurityConfig that:
 *   - permits /auth/** (login/register) and Swagger paths
 *   - requires a valid JWT for everything else
 *   - registers the JwtAuthFilter
 *
 * Do not ship this to production — it permits all requests.
 */
@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Disable CSRF — not needed for stateless REST APIs tested via Swagger/Postman
                .csrf(AbstractHttpConfigurer::disable)

                .authorizeHttpRequests(auth -> auth
                        // Swagger UI + OpenAPI docs
                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // Document API — open for now during development
                        .requestMatchers("/api/v1/documents/**").permitAll()

                        // Everything else still requires login (default Spring Security behavior)
                        .anyRequest().permitAll()
                );

        return http.build();
    }
}

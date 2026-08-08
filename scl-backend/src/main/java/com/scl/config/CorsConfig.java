package com.scl.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:*}")
    private String allowedOrigins;

    private CorsConfiguration buildCorsConfiguration() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> origins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();

        // setAllowedOriginPatterns supports credentials + wildcard patterns (e.g., https://*.vercel.app)
        if (origins.isEmpty() || origins.contains("*")) {
            configuration.setAllowedOriginPatterns(List.of("*"));
        } else {
            List<String> mutableOrigins = new ArrayList<>(origins);
            if (!mutableOrigins.contains("https://*.vercel.app")) {
                mutableOrigins.add("https://*.vercel.app");
            }
            if (!mutableOrigins.contains("https://*.onrender.com")) {
                mutableOrigins.add("https://*.onrender.com");
            }
            if (!mutableOrigins.contains("http://localhost:*")) {
                mutableOrigins.add("http://localhost:*");
            }
            configuration.setAllowedOriginPatterns(mutableOrigins);
        }

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type", "X-Total-Count"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);
        return configuration;
    }

    /** Used by Spring Security's .cors() DSL */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", buildCorsConfiguration());
        return source;
    }

    /** Registered at highest precedence so it runs BEFORE Spring Security */
    @Bean
    @Order(Ordered.HIGHEST_PRECEDENCE)
    public CorsFilter corsFilter() {
        return new CorsFilter(corsConfigurationSource());
    }
}

package com.scl.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final ObjectMapper objectMapper;
    private final Map<String, Bucket> generalBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> aiBuckets = new ConcurrentHashMap<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String uri = request.getRequestURI();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        // If unauthenticated, apply rate limit based on IP address
        String key = (auth != null && auth.isAuthenticated() && !auth.getPrincipal().equals("anonymousUser")) 
                ? auth.getName() // Usually email or username
                : getClientIP(request);

        Bucket bucket;
        if (uri.startsWith("/api/v1/ai/")) {
            bucket = aiBuckets.computeIfAbsent(key, this::createNewAiBucket);
        } else {
            bucket = generalBuckets.computeIfAbsent(key, this::createNewGeneralBucket);
        }

        if (bucket.tryConsume(1)) {
            return true;
        }

        log.warn("Rate limit exceeded for key: {} on URI: {}", key, uri);
        
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        ApiResponse<Void> apiResponse = ApiResponse.error("Rate limit exceeded");
        response.getWriter().write(objectMapper.writeValueAsString(apiResponse));
        
        return false;
    }

    private Bucket createNewGeneralBucket(String key) {
        // General API: 100 requests/min
        Bandwidth limit = Bandwidth.classic(100, Refill.greedy(100, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createNewAiBucket(String key) {
        // AI endpoints: 20 requests/min
        Bandwidth limit = Bandwidth.classic(20, Refill.greedy(20, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }
    
    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}

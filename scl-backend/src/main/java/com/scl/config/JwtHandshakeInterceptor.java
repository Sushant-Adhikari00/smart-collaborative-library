package com.scl.config;

import com.scl.security.JwtTokenProvider;
import com.scl.security.UserDetailsServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsServiceImpl userDetailsService;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            HttpServletRequest httpServletRequest = servletRequest.getServletRequest();

            String token = extractToken(httpServletRequest);

            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                try {
                    String email = jwtTokenProvider.getEmailFromToken(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());

                    // Store the authentication object in the WebSocket attributes map
                    attributes.put("user", authentication);

                    // Set it in SecurityContextHolder
                    SecurityContextHolder.getContext().setAuthentication(authentication);

                    log.debug("WebSocket Handshake authentication successful for user: {}", email);
                    return true;
                } catch (Exception e) {
                    log.error("WebSocket Handshake auth failed during user loading: {}", e.getMessage());
                }
            }
        }
        log.warn("WebSocket Handshake authentication failed: Token is missing or invalid");
        return false; // Deny handshake if unauthorized
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No-op
    }

    private String extractToken(HttpServletRequest request) {
        // Debug logging of request details
        log.debug("WebSocket handshake URI: {}", request.getRequestURI());
        log.debug("WebSocket query string: {}", request.getQueryString());

        // 1) Authorization header
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }

        // 2) Query parameter 'token' (standard)
        String tokenParam = request.getParameter("token");
        if (StringUtils.hasText(tokenParam)) {
            return tokenParam;
        }

        // 3) Fallback: manually parse raw query string (SockJS may encode differently)
        String query = request.getQueryString();
        if (StringUtils.hasText(query)) {
            for (String part : query.split("[&;]")) {
                if (part.startsWith("token=")) {
                    return part.substring(6);
                }
            }
        }

        return null;
    }
}

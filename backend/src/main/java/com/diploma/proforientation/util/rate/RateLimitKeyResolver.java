package com.diploma.proforientation.util.rate;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

/**
 * Resolves a key for rate limiting:
 * - Authenticated users → use username or ID
 * - Anonymous → fallback to IP
 * Also provides a helper to check if user is admin.
 */
@Component
public class RateLimitKeyResolver {

    private static final String USER_KEY_PREFIX = "user:";
    private static final String IP_KEY_PREFIX = "ip:";
    private static final String UNKNOWN_IP = "unknown";
    private static final String SPLIT_SIGN = ",";

    private static final String ROLE_ADMIN = "ROLE_ADMIN";
    private static final String HEADER_X_FORWARDED_FOR = "X-Forwarded-For";

    /**
     * Resolve key for a given request.
     *
     * @param request HttpServletRequest
     * @return a unique key (user:username or ip:address)
     */
    public String resolveKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserDetails user) {
            return USER_KEY_PREFIX + user.getUsername();
        }
        return IP_KEY_PREFIX + extractIp(request);
    }

    /**
     * Determine if the current authenticated user is admin.
     *
     * @return true if user has ROLE_ADMIN
     */
    public boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return false;
        }

        return auth.getAuthorities().stream()
                .anyMatch(a -> ROLE_ADMIN.equals(a.getAuthority()));
    }

    /**
     * Extract client IP from request headers (X-Forwarded-For)
     * or fallback to remote address.
     */
    private String extractIp(HttpServletRequest request) {
        if (request == null) {
            return UNKNOWN_IP;
        }

        String forwarded = request.getHeader(HEADER_X_FORWARDED_FOR);
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(SPLIT_SIGN)[0].trim();
        }

        return request.getRemoteAddr();
    }
}
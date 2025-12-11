package com.diploma.proforientation.util;

import com.diploma.proforientation.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthUtils {

    private final UserService userService;

    /**
     * @return userId if authenticated, otherwise null.
     */
    public Integer getAuthenticatedUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        boolean authenticated =
                auth != null &&
                        !(auth instanceof AnonymousAuthenticationToken) &&
                        auth.isAuthenticated();

        if (!authenticated) {
            return null;
        }

        String email = auth.getName();
        return userService.findIdByEmail(email).orElse(null);
    }
}
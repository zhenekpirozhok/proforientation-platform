package com.diploma.proforientation.unit.util.rate;

import com.diploma.proforientation.util.rate.RateLimitKeyResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitKeyResolverTest {

    private final RateLimitKeyResolver resolver = new RateLimitKeyResolver();

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void resolveKey_shouldUseUsername_whenAuthenticatedUserDetails() {
        UserDetails user = new User("john", "pw", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        HttpServletRequest request = mock(HttpServletRequest.class);

        String key = resolver.resolveKey(request);

        assertEquals("user:john", key);
        verifyNoInteractions(request);
    }

    @Test
    void resolveKey_shouldUseIpFromXForwardedFor_whenNotAuthenticated() {
        SecurityContextHolder.clearContext();

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("203.0.113.10, 70.41.3.18, 150.172.238.178");

        String key = resolver.resolveKey(request);

        assertEquals("ip:203.0.113.10", key);
        verify(request).getHeader("X-Forwarded-For");
        verify(request, never()).getRemoteAddr();
    }

    @Test
    void resolveKey_shouldUseRemoteAddr_whenXForwardedForMissingOrBlank() {
        SecurityContextHolder.clearContext();

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn("   ");
        when(request.getRemoteAddr()).thenReturn("192.168.1.50");

        String key = resolver.resolveKey(request);

        assertEquals("ip:192.168.1.50", key);
        verify(request).getHeader("X-Forwarded-For");
        verify(request).getRemoteAddr();
    }

    @Test
    void resolveKey_shouldReturnUnknownIp_whenRequestIsNullAndNotAuthenticated() {
        SecurityContextHolder.clearContext();

        String key = resolver.resolveKey(null);

        assertEquals("ip:unknown", key);
    }

    @Test
    void isAdmin_shouldReturnTrue_whenUserHasRoleAdmin() {
        UserDetails user = new User("admin", "pw", List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertTrue(resolver.isAdmin());
    }

    @Test
    void isAdmin_shouldReturnFalse_whenUserDoesNotHaveRoleAdmin() {
        UserDetails user = new User("john", "pw", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);

        assertFalse(resolver.isAdmin());
    }

    @Test
    void isAdmin_shouldReturnFalse_whenAuthenticationIsNull() {
        SecurityContextHolder.clearContext();

        assertFalse(resolver.isAdmin());
    }

    @Test
    void isAdmin_shouldReturnFalse_whenNotAuthenticated() {
        GrantedAuthority admin = new SimpleGrantedAuthority("ROLE_ADMIN");
        Authentication auth = mock(Authentication.class);

        when(auth.isAuthenticated()).thenReturn(false);

        doReturn(Collections.singletonList(admin))
                .when(auth)
                .getAuthorities();

        SecurityContextHolder.getContext().setAuthentication(auth);

        assertFalse(resolver.isAdmin());
    }

    @Test
    void resolveKey_shouldFallbackToIp_whenPrincipalIsNotUserDetails_evenIfAuthenticated() {
        var auth = mock(org.springframework.security.core.Authentication.class);
        when(auth.isAuthenticated()).thenReturn(true);
        when(auth.getPrincipal()).thenReturn("not-user-details");
        SecurityContextHolder.getContext().setAuthentication(auth);

        HttpServletRequest request = mock(HttpServletRequest.class);
        when(request.getHeader("X-Forwarded-For")).thenReturn(null);
        when(request.getRemoteAddr()).thenReturn("10.0.0.1");

        String key = resolver.resolveKey(request);

        assertEquals("ip:10.0.0.1", key);
    }
}
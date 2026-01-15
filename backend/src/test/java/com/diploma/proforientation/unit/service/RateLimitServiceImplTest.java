package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.service.impl.RateLimitServiceImpl;
import com.diploma.proforientation.util.rate.RateLimitKeyResolver;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitServiceImplTest {

    private RateLimitKeyResolver keyResolver;
    private RateLimiterRegistry registry;
    private RateLimitServiceImpl rateLimitService;
    private HttpServletRequest request;

    @BeforeEach
    void setUp() {
        keyResolver = mock(RateLimitKeyResolver.class);
        registry = mock(RateLimiterRegistry.class);
        request = mock(HttpServletRequest.class);

        rateLimitService = new RateLimitServiceImpl(keyResolver, registry);
    }

    @Test
    void tryConsumeGlobal_shouldReturnTrue_forAdmin() {
        when(keyResolver.isAdmin()).thenReturn(true);

        boolean result = rateLimitService.tryConsumeGlobal(request);

        assertTrue(result, "Admin should bypass global rate limit");
    }

    @Test
    void tryConsumeGlobal_shouldReturnTrue_whenLimiterPermits() {
        when(keyResolver.isAdmin()).thenReturn(false);
        when(keyResolver.resolveKey(request)).thenReturn("user1");

        RateLimiter limiter = mock(RateLimiter.class);
        when(limiter.acquirePermission()).thenReturn(true);

        when(registry.rateLimiter(anyString(), any(RateLimiterConfig.class))).thenReturn(limiter);

        boolean result = rateLimitService.tryConsumeGlobal(request);

        assertTrue(result, "Request should be permitted when limiter allows");
    }

    @Test
    void tryConsumeGlobal_shouldReturnFalse_whenLimiterDenies() {
        when(keyResolver.isAdmin()).thenReturn(false);
        when(keyResolver.resolveKey(request)).thenReturn("user1");

        RateLimiter limiter = mock(RateLimiter.class);
        when(limiter.acquirePermission()).thenThrow(RequestNotPermitted.class);

        when(registry.rateLimiter(anyString(), any(RateLimiterConfig.class))).thenReturn(limiter);

        boolean result = rateLimitService.tryConsumeGlobal(request);

        assertFalse(result, "Request should be denied when limiter rejects");
    }

    @Test
    void tryConsumeMethod_shouldReturnTrue_forAdmin() {
        when(keyResolver.isAdmin()).thenReturn(true);

        boolean result = rateLimitService.tryConsumeMethod(request, "submit", 5, 10);

        assertTrue(result, "Admin should bypass method rate limit");
    }

    @Test
    void tryConsumeMethod_shouldReturnTrue_whenLimiterPermits() {
        when(keyResolver.isAdmin()).thenReturn(false);
        when(keyResolver.resolveKey(request)).thenReturn("user1");

        RateLimiter limiter = mock(RateLimiter.class);
        when(limiter.acquirePermission()).thenReturn(true);

        when(registry.rateLimiter(anyString(), any(RateLimiterConfig.class))).thenReturn(limiter);

        boolean result = rateLimitService.tryConsumeMethod(request, "submit", 5, 10);

        assertTrue(result, "Request should be permitted when method limiter allows");
    }

    @Test
    void tryConsumeMethod_shouldReturnFalse_whenLimiterDenies() {
        when(keyResolver.isAdmin()).thenReturn(false);
        when(keyResolver.resolveKey(request)).thenReturn("user1");

        RateLimiter limiter = mock(RateLimiter.class);
        when(limiter.acquirePermission()).thenThrow(RequestNotPermitted.class);

        when(registry.rateLimiter(anyString(), any(RateLimiterConfig.class))).thenReturn(limiter);

        boolean result = rateLimitService.tryConsumeMethod(request, "submit", 5, 10);

        assertFalse(result, "Request should be denied when method limiter rejects");
    }

    @Test
    void tryConsumeMethod_shouldEnforceRateLimit() {
        when(keyResolver.isAdmin()).thenReturn(false);
        when(keyResolver.resolveKey(request)).thenReturn("user1");

        RateLimiterConfig config = RateLimiterConfig.custom()
                .limitForPeriod(2)
                .limitRefreshPeriod(java.time.Duration.ofSeconds(60))
                .timeoutDuration(java.time.Duration.ZERO)
                .build();

        RateLimiter limiter = RateLimiter.of("user1:submit-test", config);

        when(registry.rateLimiter(anyString(), any(RateLimiterConfig.class))).thenReturn(limiter);

        assertTrue(rateLimitService.tryConsumeMethod(request, "submit-test", 2, 60));
        assertTrue(rateLimitService.tryConsumeMethod(request, "submit-test", 2, 60));

        assertFalse(rateLimitService.tryConsumeMethod(request, "submit-test", 2, 60));
    }
}
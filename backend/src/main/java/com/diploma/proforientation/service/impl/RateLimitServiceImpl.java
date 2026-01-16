package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.service.RateLimitService;
import com.diploma.proforientation.util.rate.RateLimitKeyResolver;
import io.github.resilience4j.ratelimiter.RateLimiter;
import io.github.resilience4j.ratelimiter.RateLimiterConfig;
import io.github.resilience4j.ratelimiter.RateLimiterRegistry;
import io.github.resilience4j.ratelimiter.RequestNotPermitted;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class RateLimitServiceImpl implements RateLimitService {

    private final RateLimitKeyResolver keyResolver;
    private final RateLimiterRegistry registry;

    private final Map<String, RateLimiter> globalLimiters = new ConcurrentHashMap<>();
    private final Map<String, RateLimiter> methodLimiters = new ConcurrentHashMap<>();

    private static final int GLOBAL_LIMIT_REQUESTS = 200;
    private static final Duration GLOBAL_LIMIT_PERIOD = Duration.ofMinutes(1);
    private static final Duration TIMEOUT_DURATION = Duration.ZERO;

    private static final String GLOBAL_PREFIX = "global-";
    private static final String METHOD_SEPARATOR = ":";

    private final RateLimiterConfig globalConfig = RateLimiterConfig.custom()
            .limitForPeriod(GLOBAL_LIMIT_REQUESTS)
            .limitRefreshPeriod(GLOBAL_LIMIT_PERIOD)
            .timeoutDuration(TIMEOUT_DURATION)
            .build();

    @Override
    public boolean tryConsumeGlobal(HttpServletRequest request) {
        if (keyResolver.isAdmin()) return true;

        String key = keyResolver.resolveKey(request);
        String limiterName = GLOBAL_PREFIX + key;

        RateLimiter limiter = globalLimiters.computeIfAbsent(limiterName,
                k -> registry.rateLimiter(k, globalConfig));

        try {
            return limiter.acquirePermission();
        } catch (RequestNotPermitted ex) {
            return false;
        }
    }

    @Override
    public boolean tryConsumeMethod(HttpServletRequest request, String methodKey, int requests, int seconds) {
        if (keyResolver.isAdmin()) return true;

        String key = keyResolver.resolveKey(request);
        String limiterName = key + METHOD_SEPARATOR + methodKey;

        RateLimiter limiter = methodLimiters.computeIfAbsent(limiterName, k -> {
            RateLimiterConfig config = RateLimiterConfig.custom()
                    .limitForPeriod(requests)
                    .limitRefreshPeriod(Duration.ofSeconds(seconds))
                    .timeoutDuration(TIMEOUT_DURATION)
                    .build();
            return registry.rateLimiter(k, config);
        });

        try {
            return limiter.acquirePermission();
        } catch (RequestNotPermitted ex) {
            return false;
        }
    }
}
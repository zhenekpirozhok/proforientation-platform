package com.diploma.proforientation.util.rate;

import com.diploma.proforientation.exception.RateLimitExceededException;
import com.diploma.proforientation.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class RateLimitAspect {

    private final RateLimitService rateLimitService;

    @Around("@annotation(rateLimit)")
    public Object limit(ProceedingJoinPoint pjp, RateLimit rateLimit) throws Throwable {
        HttpServletRequest request = ((ServletRequestAttributes)
                RequestContextHolder.currentRequestAttributes()).getRequest();

        boolean allowed = rateLimitService.tryConsumeMethod(
                request,
                pjp.getSignature().toShortString(),
                rateLimit.requests(),
                rateLimit.durationSeconds()
        );

        if (!allowed) {
            throw new RateLimitExceededException(rateLimit.requests(), rateLimit.durationSeconds());
        }

        return pjp.proceed();
    }
}
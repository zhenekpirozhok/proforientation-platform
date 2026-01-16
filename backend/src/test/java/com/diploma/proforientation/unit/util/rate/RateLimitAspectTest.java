package com.diploma.proforientation.unit.util.rate;

import com.diploma.proforientation.exception.RateLimitExceededException;
import com.diploma.proforientation.service.RateLimitService;
import com.diploma.proforientation.util.rate.RateLimit;
import com.diploma.proforientation.util.rate.RateLimitAspect;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.Signature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RateLimitAspectTest {

    @Mock private RateLimitService rateLimitService;
    @Mock private ProceedingJoinPoint pjp;
    @Mock private Signature signature;
    @Mock private RateLimit rateLimit;
    @Mock private HttpServletRequest request;

    private RateLimitAspect aspect;

    @BeforeEach
    void setUp() {
        aspect = new RateLimitAspect(rateLimitService);
    }

    @AfterEach
    void tearDown() {
        RequestContextHolder.resetRequestAttributes();
    }

    @Test
    void limit_shouldProceed_whenAllowed() throws Throwable {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        when(pjp.getSignature()).thenReturn(signature);
        when(signature.toShortString()).thenReturn("SomeClass.someMethod(..)");
        when(rateLimit.requests()).thenReturn(10);
        when(rateLimit.durationSeconds()).thenReturn(60);

        when(rateLimitService.tryConsumeMethod(
                request,
                "SomeClass.someMethod(..)",
                10,
                60
        )).thenReturn(true);

        Object expected = new Object();
        when(pjp.proceed()).thenReturn(expected);

        Object actual = aspect.limit(pjp, rateLimit);

        assertSame(expected, actual);
        verify(rateLimitService).tryConsumeMethod(request, "SomeClass.someMethod(..)", 10, 60);
        verify(pjp).proceed();
    }

    @Test
    void limit_shouldThrowRateLimitExceededException_whenNotAllowed() throws Throwable {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request));

        when(pjp.getSignature()).thenReturn(signature);
        when(signature.toShortString()).thenReturn("SomeClass.someMethod(..)");
        when(rateLimit.requests()).thenReturn(10);
        when(rateLimit.durationSeconds()).thenReturn(60);

        when(rateLimitService.tryConsumeMethod(
                request,
                "SomeClass.someMethod(..)",
                10,
                60
        )).thenReturn(false);

        assertThrows(RateLimitExceededException.class, () -> aspect.limit(pjp, rateLimit));

        verify(rateLimitService).tryConsumeMethod(request, "SomeClass.someMethod(..)", 10, 60);
        verify(pjp, never()).proceed();
    }

    @Test
    void limit_shouldFailFast_whenNoRequestContext() {
        RequestContextHolder.resetRequestAttributes();

        assertThrows(IllegalStateException.class, () -> aspect.limit(pjp, rateLimit));
    }
}
package com.diploma.proforientation.config;

import com.diploma.proforientation.exception.RateLimitExceededException;
import com.diploma.proforientation.service.RateLimitService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class GlobalRateLimitFilter extends OncePerRequestFilter {

    private final RateLimitService rateLimitService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        boolean allowed = rateLimitService.tryConsumeGlobal(request);

        if (!allowed) {
            throw new RateLimitExceededException();
        }

        filterChain.doFilter(request, response);
    }
}

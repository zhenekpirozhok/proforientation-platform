package com.diploma.proforientation.service;

import jakarta.servlet.http.HttpServletRequest;

public interface RateLimitService {
    boolean tryConsumeGlobal(HttpServletRequest request);
    boolean tryConsumeMethod(HttpServletRequest request, String methodKey, int requests, int seconds);
}

package com.diploma.proforientation.dto.response;

public record AttemptStartResponse(
        Integer attemptId,
        String guestToken   // nullable for authenticated users
) {}
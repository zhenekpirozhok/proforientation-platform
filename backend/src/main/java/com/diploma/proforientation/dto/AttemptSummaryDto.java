package com.diploma.proforientation.dto;

import java.time.Instant;

public record AttemptSummaryDto(
        Integer id,
        Integer quizVersionId,
        String quizTitle,
        String status,
        Instant startedAt,
        Instant submittedAt,
        boolean isCompleted
) {}

package com.diploma.proforientation.dto;

import java.time.Instant;

public record QuizVersionDto(
        Integer id,
        Integer quizId,
        Integer version,
        Boolean isCurrent,
        Instant publishedAt
) {}

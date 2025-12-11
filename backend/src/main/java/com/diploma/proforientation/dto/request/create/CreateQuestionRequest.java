package com.diploma.proforientation.dto.request.create;

import jakarta.validation.constraints.Min;

public record CreateQuestionRequest(
        Integer quizVersionId,
        @Min(value = 0, message = "ord must be >= 0")
        Integer ord,
        String qtype,
        String text
) {}
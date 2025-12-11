package com.diploma.proforientation.dto.request.update;

import jakarta.validation.constraints.Min;

public record UpdateQuestionRequest(
        @Min(value = 0, message = "ord must be >= 0")
        Integer ord,
        String qtype,
        String text
) {}
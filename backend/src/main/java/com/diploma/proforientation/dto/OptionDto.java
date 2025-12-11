package com.diploma.proforientation.dto;

import jakarta.validation.constraints.Min;

public record OptionDto(
        Integer id,
        Integer questionId,
        @Min(value = 0, message = "ord must be >= 0")
        Integer ord,
        String label
) {}
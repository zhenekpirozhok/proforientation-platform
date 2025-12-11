package com.diploma.proforientation.dto.request.update;

import jakarta.validation.constraints.Min;

public record UpdateOptionRequest(
        @Min(value = 0, message = "ord must be >= 0")
        Integer ord,
        String label
) {}
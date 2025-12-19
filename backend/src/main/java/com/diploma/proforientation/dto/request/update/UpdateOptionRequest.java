package com.diploma.proforientation.dto.request.update;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

@Schema(description = "Request payload for updating a quiz option")
public record UpdateOptionRequest(
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "New display order of the option",
                examples = "2"
        )
        Integer ord,
        @Schema(
                description = "Updated label text of the option",
                examples = "Strongly agree"
        )
        String label
) {}
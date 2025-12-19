package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

@Schema(description = "Request payload for creating a new question option")
public record CreateOptionRequest(
        @Schema(
                description = "Identifier of the question this option belongs to",
                examples = "101"
        )
        Integer questionId,
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "Display order of the option within the question",
                examples = "1",
                minimum = "1"
        )
        Integer ord,
        @Schema(
                description = "Displayed label of the option",
                examples = "Strongly agree"
        )
        String label
) {}
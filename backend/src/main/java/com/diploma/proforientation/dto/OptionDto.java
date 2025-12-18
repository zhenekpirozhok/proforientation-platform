package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

@Schema(description = "Represents a selectable option for a quiz question")
public record OptionDto(
        @Schema(
                description = "Unique identifier of the option",
                example = "54"
        )
        Integer id,
        @Schema(
                description = "Identifier of the question this option belongs to",
                example = "7"
        )
        Integer questionId,
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "Order index of the option within the question (1-based)",
                example = "1",
                minimum = "1"
        )
        Integer ord,
        @Schema(
                description = "Text label shown to the user for this option",
                example = "Strongly agree"
        )
        String label
) {}
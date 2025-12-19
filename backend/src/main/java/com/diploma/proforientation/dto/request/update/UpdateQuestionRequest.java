package com.diploma.proforientation.dto.request.update;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

@Schema(description = "Request payload for updating a quiz question")
public record UpdateQuestionRequest(
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "New display order of the question",
                examples = "5"
        )
        Integer ord,
        @Schema(
                description = "Updated question type",
                examples = "single_choice",
                allowableValues = {
                        "single_choice",
                        "multi_choice",
                        "liker_scale_5",
                        "liker_scale_7"
                }
        )
        String qtype,
        @Schema(
                description = "Updated question text",
                examples = "How interested are you in programming?"
        )
        String text
) {}
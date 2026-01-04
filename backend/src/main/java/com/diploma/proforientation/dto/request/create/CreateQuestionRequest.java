package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

@Schema(description = "Request payload for creating a quiz question")
public record CreateQuestionRequest(
        @Schema(
                description = "Identifier of the quiz version this question belongs to",
                examples = "1"
        )
        Integer quizVersionId,
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "Order of the question within the quiz version",
                examples = "49",
                minimum = "1"
        )
        Integer ord,
        @Schema(
                description = "Type of the question (e.g. single_choice, multi_choice, liker_scale_5)",
                examples = "SINGLE_CHOICE",
                allowableValues = {
                        "SINGLE_CHOICE",
                        "MULTI_CHOICE",
                        "LIKER_SCALE_5",
                        "LIKER_SCALE_7"
                }
        )
        String qtype,
        @Schema(
                description = "Question text shown to the user",
                examples = "I enjoy solving complex technical problems."
        )
        String text
) {}
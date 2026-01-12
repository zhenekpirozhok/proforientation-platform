package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents a quiz definition and its metadata")
public record QuizDto(
        @Schema(
                description = "Unique identifier of the quiz",
                examples = "1"
        )
        Integer id,
        @Schema(
                description = "Short unique code used to reference the quiz",
                examples = "riasec"
        )
        String code,
        @Schema(
                description = "Human-readable title of the quiz",
                examples = "RIASEC Career Orientation Test"
        )
        String title,
        @Schema(
                description = "Current lifecycle status of the quiz",
                examples = "PUBLISHED",
                allowableValues = {
                        "PUBLISHED",
                        "DRAFT",
                        "ARCHIVED"
                })
        String status,
        @Schema(
                description = "Processing mode used to evaluate quiz results",
                examples = "ML_RIASEC",
                allowableValues = {
                        "ML_RIASEC",
                        "LLM"
                })
        String processingMode,
        @Schema(
                description = "Identifier of the category this quiz belongs to",
                examples = "5"
        )
        Integer categoryId,
        @Schema(
                description = "Identifier of the user who authored the quiz",
                examples = "1"
        )
        Integer authorId,

        @Schema(
                description = "Localized quiz description",
                example = "This quiz helps identify suitable career paths"
        )
        String descriptionDefault,

        @Schema(
                description = "Time limit per question in seconds",
                example = "30",
                minimum = "0"
        )
        int secondsPerQuestionDefault
) {}
package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for creating a new quiz")
public record CreateQuizRequest(
        @Schema(
                description = "Unique quiz code used internally",
                examples = "riasec_main"
        )
        String code,
        @Schema(
                description = "Human-readable quiz title",
                examples = "Career Orientation Test (RIASEC)"
        )
        String title,
        @Schema(
                description = "Processing mode defining how results are calculated",
                examples = "ML_RIASEC",
                allowableValues = {
                        "ML_RIASEC",
                        "LLM"
                }
        )
        String processingMode,

        @Schema(
                description = "Quiz status",
                examples = "DRAFT",
                allowableValues = {
                        "DRAFT",
                        "PUBLISHED",
                        "ARCHIVED"
                }
        )
        String status,

        @Schema(
                description = "Quiz description (default language)",
                examples = "This quiz helps determine suitable career paths."
        )
        String descriptionDefault,

        @Schema(
                description = "Time limit per question in seconds",
                examples = "30",
                defaultValue = "30"
        )
        Integer secondsPerQuestionDefault,

        @Schema(
                description = "Identifier of the quiz category",
                examples = "2"
        )
        Integer categoryId,
        @Schema(
                description = "Identifier of the quiz author (admin user)",
                examples = "1"
        )
        Integer authorId
) {}
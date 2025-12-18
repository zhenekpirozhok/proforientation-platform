package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents a quiz definition and its metadata")
public record QuizDto(
        @Schema(
                description = "Unique identifier of the quiz",
                example = "1"
        )
        Integer id,
        @Schema(
                description = "Short unique code used to reference the quiz",
                example = "riasec_main"
        )
        String code,
        @Schema(
                description = "Human-readable title of the quiz",
                example = "RIASEC Career Orientation Test"
        )
        String title,
        @Schema(
                description = "Current lifecycle status of the quiz",
                example = "published",
                allowableValues = {
                        "published",
                        "draft",
                        "archived"
                })
        String status,
        @Schema(
                description = "Processing mode used to evaluate quiz results",
                example = "ml_riasec",
                allowableValues = {
                        "ml_riasec",
                        "llm"
                })
        String processingMode,
        @Schema(
                description = "Identifier of the category this quiz belongs to",
                example = "5"
        )
        Integer categoryId,
        @Schema(
                description = "Identifier of the user who authored the quiz",
                example = "1"
        )
        Integer authorId
) {}
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
                examples = "ml_riasec",
                allowableValues = {
                        "ml_riasec",
                        "llm"
                }
        )
        String processingMode,
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
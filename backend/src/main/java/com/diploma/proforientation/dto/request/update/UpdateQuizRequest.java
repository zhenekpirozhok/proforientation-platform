package com.diploma.proforientation.dto.request.update;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for updating quiz metadata")
public record UpdateQuizRequest(
        @Schema(
                description = "Updated quiz title",
                examples = "Software Engineering Career Quiz"
        )
        String title,
        @Schema(
                description = "Updated quiz processing mode",
                examples = "ML_RIASEC",
                allowableValues = {
                        "ML_RIASEC",
                        "LLM"
                }
        )
        String processingMode,

        @Schema(
                description = "Updated quiz status",
                examples = "PUBLISHED",
                allowableValues = {
                        "DRAFT",
                        "PUBLISHED",
                        "ARCHIVED"
                }
        )
        String status,

        @Schema(
                description = "Updated quiz description (default language)",
                examples = "Updated description for the quiz."
        )
        String descriptionDefault,

        @Schema(
                description = "Updated time limit per question in seconds",
                examples = "45"
        )
        Integer secondsPerQuestionDefault,

        @Schema(
                description = "Identifier of the new quiz category",
                examples = "4"
        )
        Integer categoryId
) {}
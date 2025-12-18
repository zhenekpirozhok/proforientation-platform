package com.diploma.proforientation.dto.request.update;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for updating quiz metadata")
public record UpdateQuizRequest(
        @Schema(
                description = "Updated quiz title",
                example = "Software Engineering Career Quiz"
        )
        String title,
        @Schema(
                description = "Updated quiz processing mode",
                example = "ml",
                allowableValues = {
                        "ml_riasec",
                        "llm"
                }
        )
        String processingMode,
        @Schema(
                description = "Identifier of the new quiz category",
                example = "4"
        )
        Integer categoryId
) {}
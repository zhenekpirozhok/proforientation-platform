package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Defines how quiz results are processed",
        example = "ml_riasec"
)
public enum QuizProcessingMode {
    @Schema(description = "Results are evaluated using a machine learning model")
    ml_riasec,
    @Schema(description = "Results are evaluated using large lanquage model")
    llm
}
package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Defines how quiz results are processed",
        example = "ML_RIASEC"
)
public enum QuizProcessingMode {
    @Schema(description = "Results are evaluated using a machine learning model")
    ML_RIASEC,
    @Schema(description = "Results are evaluated using large lanquage model")
    LLM
}
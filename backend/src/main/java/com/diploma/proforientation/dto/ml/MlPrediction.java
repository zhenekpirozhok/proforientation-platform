package com.diploma.proforientation.dto.ml;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Single ML prediction entry with probability score")
public record MlPrediction(
        @Schema(
                description = "ML class or major predicted by the model",
                example = "Software Engineer"
        )
        String major,
        @Schema(
                description = "Probability score assigned by the ML model (range 0.0 – 1.0)",
                example = "0.82",
                minimum = "0.0",
                maximum = "1.0"
        )
        BigDecimal probability) {}

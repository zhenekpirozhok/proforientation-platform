package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Trait score entry")
public record TraitScoreDto(
        @Schema(description = "Short code representing the trait (e.g. RIASEC dimension)",
                examples = "R")
        String traitCode,

        @Schema(description = "Probability score assigned by the ML model (range 0.0 – 1.0)",
                examples = "0.75")
        BigDecimal score
) {}
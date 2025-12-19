package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents a psychological trait used in assessment scoring")
public record TraitDto(
        @Schema(
                description = "Unique identifier of the trait",
                examples = "1"
        )
        Integer id,
        @Schema(
                description = "Short code representing the trait (e.g. RIASEC dimension)",
                examples = "R"
        )
        String code,
        @Schema(
                description = "Human-readable name of the trait",
                examples = "Realistic"
        )
        String name,
        @Schema(
                description = "Detailed description of the trait",
                examples = "Preference for hands-on activities and practical problem solving"
        )
        String description,
        @Schema(
                description = "Code of the opposing trait in a bipolar pair",
                examples = "S"
        )
        String bipolarPairCode
) {}
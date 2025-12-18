package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for creating a psychological trait")
public record CreateTraitRequest(

        @Schema(
                description = "Unique trait code (e.g. R, I, A)",
                example = "R"
        )
        String code,
        @Schema(
                description = "Human-readable trait name",
                example = "Realistic"
        )
        String name,
        @Schema(
                description = "Description explaining the trait meaning",
                example = "Preference for practical, hands-on activities"
        )
        String description,
        @Schema(
                description = "Code of the opposite trait in a bipolar pair",
                example = "S"
        )
        String bipolarPairCode
) {}
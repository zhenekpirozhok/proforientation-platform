package com.diploma.proforientation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

@Schema(description = "Represents the association between an option and a trait with a weighted contribution")
public record OptionTraitRequest(
        @Schema(
                description = "Identifier of the trait profile",
                examples = "3",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        Integer traitId,
        @Schema(
                description = """
                        Weight applied to the trait when this option is selected.
                        Can be positive or negative depending on scoring logic.
                        """,
                examples = "1.25",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        BigDecimal weight
) {}
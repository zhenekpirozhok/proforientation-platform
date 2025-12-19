package com.diploma.proforientation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Request payload for assigning multiple trait weights to a question option")
public record OptionTraitListRequest(
        @Schema(
                description = "List of trait-weight associations for the option",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        List<OptionTraitRequest> traits
) {}
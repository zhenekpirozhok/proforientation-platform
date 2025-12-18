package com.diploma.proforientation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

@Schema(description = "Request payload for submitting multiple answers in a single operation")
public record AddAnswersBulkRequest(
        @Schema(
                description = "List of selected option IDs",
                example = "[101, 102, 103]",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotEmpty List<Integer> optionIds
) {}

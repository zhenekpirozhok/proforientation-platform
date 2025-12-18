package com.diploma.proforientation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for submitting a single answer to a quiz attempt")
public record AddAnswerRequest(
        @Schema(
                description = "Identifier of the selected option",
                example = "123",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        Integer optionId) {}
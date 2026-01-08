package com.diploma.proforientation.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

@Schema(description = "Request payload for deleting selected attempts")
public record DeleteAttemptsRequest(
        @NotEmpty
        @Schema(description = "Attempt IDs to remove", example = "[1, 2]")
        List<Integer> attemptIds,

        @AssertTrue(message = "Confirmation required to delete attempts")
        @Schema(
                description = "Confirmation flag. Must be true to perform deletion.",
                example = "true"
        )
        boolean confirm
) {}
package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Summary information about a quiz attempt")
public record AttemptSummaryDto(
        @Schema(
                description = "Unique identifier of the attempt",
                example = "101"
        )
        Integer id,
        @Schema(
                description = "Identifier of the quiz version associated with this attempt",
                example = "12"
        )
        Integer quizVersionId,
        @Schema(
                description = "Title of the quiz",
                example = "RIASEC Career Orientation Test"
        )
        String quizTitle,
        @Schema(
                description = "Current status of the attempt",
                example = "in_progress",
                allowableValues = {
                        "in_progress",
                        "completed"
                })
        String status,
        @Schema(
                description = "Timestamp when the attempt was started (ISO-8601)",
                example = "2025-01-15T10:05:00Z"
        )
        Instant startedAt,
        @Schema(
                description = "Timestamp when the attempt was submitted, null if not completed",
                example = "2025-01-15T10:20:30Z",
                nullable = true
        )
        Instant submittedAt,
        @Schema(
                description = "Indicates whether the attempt has been completed",
                example = "true"
        )
        boolean isCompleted
) {}

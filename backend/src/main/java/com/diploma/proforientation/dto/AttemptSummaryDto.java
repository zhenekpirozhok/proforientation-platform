package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Summary information about a quiz attempt")
public record AttemptSummaryDto(
        @Schema(
                description = "Unique identifier of the attempt",
                examples = "101"
        )
        Integer id,
        @Schema(
                description = "Identifier of the quiz version associated with this attempt",
                examples = "12"
        )
        Integer quizVersionId,
        @Schema(
                description = "Title of the quiz",
                examples = "RIASEC Career Orientation Test"
        )
        String quizTitle,
        @Schema(
                description = "Current status of the attempt",
                examples = "in_progress",
                allowableValues = {
                        "in_progress",
                        "completed"
                })
        String status,
        @Schema(
                description = "Timestamp when the attempt was started (ISO-8601)",
                examples = "2025-01-15T10:05:00Z"
        )
        Instant startedAt,
        @Schema(
                description = "Timestamp when the attempt was submitted, null if not completed",
                examples = "2025-01-15T10:20:30Z",
                nullable = true
        )
        Instant submittedAt,
        @Schema(
                description = "Indicates whether the attempt has been completed",
                examples = "true"
        )
        boolean isCompleted
) {}

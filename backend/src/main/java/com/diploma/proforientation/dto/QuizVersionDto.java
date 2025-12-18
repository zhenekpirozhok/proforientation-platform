package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

@Schema(description = "Represents a specific published version of a quiz")
public record QuizVersionDto(
        @Schema(
                description = "Unique identifier of the quiz version",
                example = "1"
        )
        Integer id,
        @Schema(
                description = "Identifier of the quiz this version belongs to",
                example = "1"
        )
        Integer quizId,
        @Schema(
                description = "Sequential version number of the quiz",
                example = "1"
        )
        Integer version,
        @Schema(
                description = "Indicates whether this is the currently active quiz version",
                example = "true"
        )
        Boolean isCurrent,
        @Schema(
                description = "Timestamp when the quiz version was published",
                example = "2025-01-10T12:30:00Z"
        )
        Instant publishedAt
) {}

package com.diploma.proforientation.dto;

import com.diploma.proforientation.model.enumeration.QuizStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;

public record QuizMetricsFilter(
        @Schema(
                description = "Exact quiz ID"
        )
        Integer quizId,
        @Schema(
                description = "Substring match for quiz code (case-insensitive)",
                example = "career"
        )
        String quizCodeContains,
        @Schema(
                description = "Quiz status",
                example = "PUBLISHED"
        )
        QuizStatus quizStatus,
        @Schema(
                description = "Quiz category ID"
        )
        Integer categoryId,

        @Schema(
                description = "Minimum total attempts count"
        )
        Integer attemptsTotalMin,

        @Schema(
                description = "Maximum total attempts count"
        )
        Integer attemptsTotalMax,

        @Schema(
                description = "Minimum submitted attempts count"
        )
        Integer attemptsSubmittedMin,
        @Schema(
                description = "Maximum submitted attempts count"
        )
        Integer attemptsSubmittedMax,

        @Schema(
                description = "Minimum total questions count"
        )
        Integer questionsTotalMin,
        @Schema(
                description = "Maximum total questions count"
        )
        Integer questionsTotalMax,

        @Schema(
                description = "Minimum average quiz duration in seconds"
        )
        BigDecimal avgDurationMin,
        @Schema(
                description = "Maximum average quiz duration in seconds"
        )
        BigDecimal avgDurationMax,

        @Schema(
                description = "Minimum estimated quiz duration in seconds"
        )
        Integer estimatedDurationMin,
        @Schema(
                description = "Maximum estimated quiz duration in seconds"
        )
        Integer estimatedDurationMax
) {}
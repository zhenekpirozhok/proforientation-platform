package com.diploma.proforientation.dto.analytics;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Schema(description = "Overview analytics data for a quiz version")
public record QuizAnalyticsOverviewDto(

        @Schema(description = "Quiz identifier")
        Integer quizId,

        @Schema(description = "Quiz version identifier")
        Integer quizVersionId,

        @Schema(description = "Number of started quiz attempts")
        Integer attemptsStarted,

        @Schema(description = "Number of completed quiz attempts")
        Integer attemptsCompleted,

        @Schema(
                description = "Completion rate (completed / started)",
                example = "0.74",
                minimum = "0.0",
                maximum = "1.0"
        )
        BigDecimal completionRate,

        @Schema(
                description = "Average quiz completion duration in seconds",
                example = "312.5"
        )
        BigDecimal avgDurationSeconds,

        @Schema(description = "Daily quiz activity statistics")
        List<DailyPoint> activityDaily,

        @Schema(description = "Top professions based on first-choice selections")
        List<TopProfession> topProfessions
) {

    @Schema(description = "Daily quiz activity data point")
    public record DailyPoint(

            @Schema(description = "Date of activity")
            LocalDate day,

            @Schema(description = "Number of quiz attempts started on this day")
            Integer started,

            @Schema(description = "Number of quiz attempts completed on this day")
            Integer completed,

            @Schema(
                    description = "Average quiz duration in seconds for this day",
                    example = "298.1"
            )
            BigDecimal avgDurationSeconds
    ) {}

    @Schema(description = "Top profession analytics entry")
    public record TopProfession(

            @Schema(description = "Profession identifier")
            Integer professionId,

            @Schema(
                    description = "Profession title",
                    example = "Data Scientist"
            )
            String professionTitle,

            @Schema(description = "Number of times this profession was selected as top choice")
            Integer top1Count
    ) {}
}
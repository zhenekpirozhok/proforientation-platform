package com.diploma.proforientation.dto.analytics;

import io.swagger.v3.oas.annotations.media.Schema;

import java.math.BigDecimal;
import java.util.List;

@Schema(description = "Detailed analytics data for a quiz version")
public record QuizAnalyticsDetailedDto(

        @Schema(description = "Quiz identifier")
        Integer quizId,

        @Schema(description = "Quiz version identifier")
        Integer quizVersionId,

        @Schema(description = "Average selected choice per question")
        List<QuestionAvgChoice> avgChoicePerQuestion,

        @Schema(description = "Distribution of selected options per question")
        List<OptionDistribution> optionDistribution,

        @Schema(description = "Question discrimination metrics")
        List<QuestionDiscrimination> discrimination
) {

    @Schema(description = "Average choice statistics for a question")
    public record QuestionAvgChoice(

            @Schema(description = "Question identifier")
            Integer questionId,

            @Schema(description = "Question order in the quiz")
            Integer questionOrd,

            @Schema(
                    description = "Average selected option index for the question",
                    example = "2.4"
            )
            BigDecimal avgChoice,

            @Schema(description = "Total number of answers submitted for the question")
            Integer answersCount
    ) {}

    @Schema(description = "Distribution of answers for a question option")
    public record OptionDistribution(

            @Schema(description = "Question identifier")
            Integer questionId,

            @Schema(description = "Question order in the quiz")
            Integer questionOrd,

            @Schema(description = "Option identifier")
            Integer optionId,

            @Schema(description = "Option order within the question")
            Integer optionOrd,

            @Schema(description = "Number of times this option was selected")
            Integer count
    ) {}

    @Schema(description = "Discrimination index of a question")
    public record QuestionDiscrimination(

            @Schema(description = "Question identifier")
            Integer questionId,

            @Schema(
                    description = "Normalized discrimination index",
                    example = "0.67",
                    minimum = "0.0",
                    maximum = "1.0"
            )
            BigDecimal discNorm,

            @Schema(
                    description = "Qualitative interpretation of discrimination",
                    example = "GOOD"
            )
            String discQuality,

            @Schema(description = "Number of submitted attempts used for calculation")
            Integer attemptsSubmitted
    ) {}
}
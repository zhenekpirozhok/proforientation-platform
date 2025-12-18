package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

import java.util.List;

@Schema(description = "Represents a question within a quiz version")
public record QuestionDto(
        @Schema(
                description = "Unique identifier of the question",
                example = "101"
        )
        Integer id,
        @Schema(
                description = "Identifier of the quiz version this question belongs to",
                example = "1"
        )
        Integer quizVersionId,
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "Order of the question within the quiz",
                example = "3",
                minimum = "1"
        )
        Integer ord,
        @Schema(
                description = "Type of question defining how the user should answer",
                example = "single_choice",
                allowableValues = {
                        "single_choice",
                        "multi_choice",
                        "liker_scale_5",
                        "liker_scale_7"
                }
        )
        String qtype,
        @Schema(
                description = "Text displayed to the user for this question",
                example = "I enjoy solving practical problems using my hands"
        )
        String text,
        @Schema(
                description = "List of selectable answer options for the question"
        )
        List<OptionDto> options
) {}
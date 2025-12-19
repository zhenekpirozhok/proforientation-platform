package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;

import java.util.List;

@Schema(description = "Represents a question within a quiz version")
public record QuestionDto(
        @Schema(
                description = "Unique identifier of the question",
                examples = "101"
        )
        Integer id,
        @Schema(
                description = "Identifier of the quiz version this question belongs to",
                examples = "1"
        )
        Integer quizVersionId,
        @Min(value = 1, message = "ord must be >= 1")
        @Schema(
                description = "Order of the question within the quiz",
                examples = "3",
                minimum = "1"
        )
        Integer ord,
        @Schema(
                description = "Type of question defining how the user should answer",
                examples = "single_choice",
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
                examples = "I enjoy solving practical problems using my hands"
        )
        String text,
        @Schema(
                description = "List of selectable answer options for the question"
        )
        List<OptionDto> options
) {}
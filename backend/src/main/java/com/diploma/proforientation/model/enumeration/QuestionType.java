package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Type of question and expected answer format",
        example = "single_choice"
)
public enum QuestionType {
    @Schema(description = "User selects exactly one option from a list")
    single_choice,
    @Schema(description = "User may select multiple options from a list")
    multi_choice,
    @Schema(description = "Likert scale question with values from 1 to 5")
    liker_scale_5,
    @Schema(description = "Likert scale question with values from 1 to 7")
    liker_scale_7
}
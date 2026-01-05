package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Type of question and expected answer format",
        example = "single_choice"
)
public enum QuestionType {
    SINGLE_CHOICE,
    MULTI_CHOICE,
    LIKER_SCALE_5,
    LIKER_SCALE_7
}
package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Lifecycle status of a quiz",
        example = "PUBLISHED"
)
public enum QuizStatus {
    @Schema(description = "Quiz is in draft state and not visible to users")
    DRAFT,
    @Schema(description = "Quiz is visible and available for users")
    PUBLISHED,
    @Schema(description = "Quiz is archived and no longer maintained")
    ARCHIVED
}
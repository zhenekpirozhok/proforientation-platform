package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Lifecycle status of a quiz",
        example = "published"
)
public enum QuizStatus {
    @Schema(description = "Quiz is in draft state and not visible to users")
    draft,
    @Schema(description = "Quiz is visible and available for users")
    published,
    @Schema(description = "Quiz is archived and no longer maintained")
    archived
}
package com.diploma.proforientation.model.enumeration;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(
        description = "Lifecycle status of a quiz",
        example = "PUBLISHED"
)
public enum QuizStatus {

    @Schema(description = "Quiz is in draft state and has never been published")
    DRAFT,

    @Schema(description = "Quiz has a published version and is visible to users")
    PUBLISHED,

    @Schema(description = "Quiz has a published version, but also has unpublished changes")
    UPDATED,

    @Schema(description = "Quiz is archived and no longer maintained or visible")
    ARCHIVED
}

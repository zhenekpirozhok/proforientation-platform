package com.diploma.proforientation.dto.request.update;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for updating a localized translation value")
public record UpdateTranslationRequest(
        @Schema(
                description = "Updated translated text value",
                examples = "Software Engineer"
        )
        String text
) {}
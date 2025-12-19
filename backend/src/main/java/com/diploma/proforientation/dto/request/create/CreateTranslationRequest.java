package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Request payload for creating or updating a translation")
public record CreateTranslationRequest(
        @Schema(description = "Type of the translated entity",
                examples = "profession")
        String entityType,
        @Schema(
                description = "Identifier of the entity being translated",
                example = "15"
        )
        Integer entityId,
        @Schema(
                description = "Field of the entity to translate",
                examples = "title"
        )
        String field,
        @Pattern(
                regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$",
                message = "locale must be a valid language code (e.g., en, en-US)"
        )
        @Schema(
                description = "Language or locale code",
                examples = "en",
                pattern = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$"
        )
        String locale,
        @Schema(
                description = "Translated text value",
                examples = "Software Engineer"
        )
        String text
) {}
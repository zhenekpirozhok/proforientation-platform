package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Translation data transfer object")
public record TranslationDto(
        @Schema(description = "Unique translation identifier",
                examples = "1")
        Integer id,
        @Schema(description = "Type of the translated entity",
                examples = "profession")
        String entityType,
        @Schema(description = "Identifier of the related entity",
                examples = "1")
        Integer entityId,
        @Schema(description = "Translated field name",
                examples = "title")
        String field,
        @Schema(description = "Language code (ISO 639-1)",
                examples = "en")
        String locale,
        @Schema(description = "Localized text value",
                examples = "Software Engineer")
        String text
) {}
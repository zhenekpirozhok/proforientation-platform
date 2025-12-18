package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Translation data transfer object")
public record TranslationDto(
        @Schema(description = "Unique translation identifier",
                example = "1")
        Integer id,
        @Schema(description = "Type of the translated entity",
                example = "profession")
        String entityType,
        @Schema(description = "Identifier of the related entity",
                example = "1")
        Integer entityId,
        @Schema(description = "Translated field name",
                example = "title")
        String field,
        @Schema(description = "Language code (ISO 639-1)",
                example = "en")
        String locale,
        @Schema(description = "Localized text value",
                example = "Software Engineer")
        String text
) {}
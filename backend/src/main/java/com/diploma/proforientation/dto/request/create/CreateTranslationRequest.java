package com.diploma.proforientation.dto.request.create;

import jakarta.validation.constraints.Pattern;

public record CreateTranslationRequest(
        String entityType,
        Integer entityId,
        String field,
        @Pattern(
                regexp = "^[a-zA-Z]{2,3}(-[a-zA-Z]{2,3})?$",
                message = "locale must be a valid language code (e.g., en, en-US)"
        )
        String locale,
        String text
) {}
package com.diploma.proforientation.dto.request.create;

public record CreateTranslationRequest(
        String entityType,
        Integer entityId,
        String field,
        String locale,
        String text
) {}
package com.diploma.proforientation.dto;

public record TranslationDto(
        Integer id,
        String entityType,
        Integer entityId,
        String field,
        String locale,
        String text
) {}
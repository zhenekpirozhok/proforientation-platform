package com.diploma.proforientation.dto.request.create;

public record CreateQuizRequest(
        String code,
        String title,
        String processingMode,
        Integer categoryId,
        Integer authorId
) {}
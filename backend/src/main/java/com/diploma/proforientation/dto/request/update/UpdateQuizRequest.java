package com.diploma.proforientation.dto.request.update;

public record UpdateQuizRequest(
        String title,
        String processingMode,
        Integer categoryId
) {}
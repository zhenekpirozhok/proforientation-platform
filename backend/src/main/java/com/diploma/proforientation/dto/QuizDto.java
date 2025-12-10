package com.diploma.proforientation.dto;

public record QuizDto(
        Integer id,
        String code,
        String title,
        String status,
        String processingMode,
        Integer categoryId,
        Integer authorId
) {}
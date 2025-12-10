package com.diploma.proforientation.dto;

public record ProfessionDto(
        Integer id,
        String code,
        String title,
        String description,
        String mlClassCode,
        Integer categoryId
) {}
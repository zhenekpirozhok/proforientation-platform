package com.diploma.proforientation.dto.request.create;

public record CreateProfessionRequest(
        String code,
        String title,
        String description,
        String mlClassCode,
        Integer categoryId
) {}

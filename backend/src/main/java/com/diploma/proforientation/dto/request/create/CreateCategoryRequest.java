package com.diploma.proforientation.dto.request.create;

public record CreateCategoryRequest(
        String code,
        String name,
        String colorCode
) {}
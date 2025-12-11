package com.diploma.proforientation.dto;

import jakarta.validation.constraints.Pattern;

public record ProfessionCategoryDto(
        Integer id,
        String code,
        String name,
        @Pattern(
                regexp = "^#[0-9A-Fa-f]{6}$",
                message = "Color code must be a valid hex color (e.g. #FF00AA)"
        )
        String colorCode
) {}
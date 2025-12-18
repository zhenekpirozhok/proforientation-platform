package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Represents a category used to group professions")
public record ProfessionCategoryDto(
        @Schema(
                description = "Unique identifier of the profession category",
                example = "5"
        )
        Integer id,
        @Schema(
                description = "Short code identifying the category",
                example = "IT"
        )
        String code,
        @Schema(
                description = "Human-readable name of the category",
                example = "Information Technology"
        )
        String name,
        @Pattern(
                regexp = "^#[0-9A-Fa-f]{6}$",
                message = "Color code must be a valid hex color (e.g. #FF00AA)"
        )
        @Schema(
                description = "Hex color code used for UI representation of the category",
                example = "#FF8800",
                pattern = "^#[0-9A-Fa-f]{6}$"
        )
        String colorCode
) {}
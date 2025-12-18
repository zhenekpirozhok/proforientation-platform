package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Pattern;

@Schema(description = "Request payload for creating a new profession category")
public record CreateCategoryRequest(
        @Schema(
                description = "Unique code of the category",
                example = "IT"
        )
        String code,
        @Schema(
                description = "Human-readable category name",
                example = "Information Technology"
        )
        String name,
        @Pattern(
                regexp = "^#[0-9A-Fa-f]{6}$",
                message = "Color code must be a valid hex color (e.g. #FF00AA)"
        )
        @Schema(
                description = "Hex color code associated with the category (used in UI)",
                example = "#1E90FF"
        )
        String colorCode
) {}
package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents a profession that can be recommended to users based on quiz results")
public record ProfessionDto(
        @Schema(
                description = "Unique identifier of the profession",
                example = "42"
        )
        Integer id,
        @Schema(
                description = "Short internal code of the profession",
                example = "software_engineer"
        )
        String code,
        @Schema(
                description = "Human-readable title of the profession",
                example = "Software Engineer"
        )
        String title,
        @Schema(
                description = "Detailed description of the profession, shown to end users",
                example = "Software engineers design, develop, and maintain software systems and applications."
        )
        String description,
        @Schema(
                description = "Machine Learning class code used to map ML predictions to this profession",
                example = "SE"
        )
        String mlClassCode,
        @Schema(
                description = "Identifier of the profession category",
                example = "3"
        )
        Integer categoryId
) {}
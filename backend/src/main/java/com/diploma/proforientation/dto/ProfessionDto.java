package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents a profession that can be recommended to users based on quiz results")
public record ProfessionDto(
        @Schema(
                description = "Unique identifier of the profession",
                examples = "42"
        )
        Integer id,
        @Schema(
                description = "Short internal code of the profession",
                examples = "software_engineer"
        )
        String code,
        @Schema(
                description = "Human-readable title of the profession",
                examples = "Software Engineer"
        )
        String title,
        @Schema(
                description = "Detailed description of the profession, shown to end users",
                examples = "Software engineers design, develop, and maintain software systems and applications."
        )
        String description,
        @Schema(
                description = "Machine Learning class code used to map ML predictions to this profession",
                examples = "SE"
        )
        String mlClassCode,
        @Schema(
                description = "Identifier of the profession category",
                examples = "3"
        )
        Integer categoryId
) {}
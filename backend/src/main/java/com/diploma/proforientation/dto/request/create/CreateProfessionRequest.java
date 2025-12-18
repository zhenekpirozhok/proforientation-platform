package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for creating a new profession")
public record CreateProfessionRequest(

        @Schema(
                description = "Unique profession code used internally",
                example = "software_engineer"
        )
        String code,
        @Schema(
                description = "Human-readable profession title",
                example = "Software Engineer"
        )
        String title,
        @Schema(
                description = "Detailed description of the profession",
                example = "Designs, builds, and maintains software systems and applications."
        )
        String description,
        @Schema(
                description = "ML classification code returned by the ML model",
                example = "SE"
        )
        String mlClassCode,
        @Schema(
                description = "Identifier of the profession category",
                example = "3"
        )
        Integer categoryId
) {}

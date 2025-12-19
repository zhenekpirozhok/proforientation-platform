package com.diploma.proforientation.dto.request.create;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Request payload for creating a new profession")
public record CreateProfessionRequest(

        @Schema(
                description = "Unique profession code used internally",
                examples = "software_engineer"
        )
        String code,
        @Schema(
                description = "Human-readable profession title",
                examples = "Software Engineer"
        )
        String title,
        @Schema(
                description = "Detailed description of the profession",
                examples = "Designs, builds, and maintains software systems and applications."
        )
        String description,
        @Schema(
                description = "ML classification code returned by the ML model",
                examples = "SE"
        )
        String mlClassCode,
        @Schema(
                description = "Identifier of the profession category",
                examples = "3"
        )
        Integer categoryId
) {}

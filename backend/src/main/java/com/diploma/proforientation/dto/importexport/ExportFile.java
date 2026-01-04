package com.diploma.proforientation.dto.importexport;


import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents a file generated for export")
public record ExportFile(
        @Schema(description = "The name of the exported file, e.g., questions.csv", example = "questions.csv")
        String filename,
        @Schema(description = "The content of the file as bytes")
        byte[] bytes
) {}
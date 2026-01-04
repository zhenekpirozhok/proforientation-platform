package com.diploma.proforientation.dto.importexport;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Represents an error encountered during CSV import")
public record ImportErrorDto(
        @Schema(description = "Row number in the CSV where the error occurred", example = "2")
        int rowNumber,
        @Schema(description = "Field/column name causing the error", example = "quiz_version_id")
        String field,
        @Schema(description = "Detailed error message", example = "Required field is missing")
        String message
) {}
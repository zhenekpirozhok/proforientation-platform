package com.diploma.proforientation.dto.importexport;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Represents the result of a CSV import operation")
public record ImportResultDto(
        @Schema(description = "Total number of rows read from the CSV file (excluding header)", example = "10")
        int totalRows,
        @Schema(description = "Number of rows successfully imported", example = "8")
        int successCount,
        @Schema(description = "List of errors encountered during import")
        List<ImportErrorDto> errors
) {}
package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.service.impl.CsvImportServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@Tag(name = "Import", description = "CSV data import operations")
public class ImportController {
    private final CsvImportServiceImpl csvImportService;

    @PostMapping(value = "/questions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import questions from CSV",
            description = """
                    Imports quiz questions from a CSV file.
                    The file must contain a header row and valid question data.
                    Only administrators are allowed to perform this operation.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Questions imported successfully",
            content = @Content(schema = @Schema(implementation = ImportResultDto.class))
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid CSV format or validation errors",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public ImportResultDto importQuestions(
            @Parameter(description = "CSV file containing questions", required = true)
            @RequestPart("file") MultipartFile file
    ) {
        if (file == null) {
            throw new IllegalArgumentException("File must not be null");
        }
        return csvImportService.importQuestions(file);
    }

    @PostMapping(value = "/translations", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import translations from CSV",
            description = """
                    Imports translations for quizzes, questions, options, and professions.
                    Existing translations are updated, new ones are created.
                    Only administrators are allowed to perform this operation.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Translations imported successfully",
            content = @Content(schema = @Schema(implementation = ImportResultDto.class))
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid CSV format or validation errors",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public ImportResultDto importTranslations(
            @Parameter(description = "CSV file containing translations", required = true)
            @RequestPart("file") MultipartFile file
    ) {
        if (file == null) {
            throw new IllegalArgumentException("File must not be null");
        }
        return csvImportService.importTranslations(file);
    }
}

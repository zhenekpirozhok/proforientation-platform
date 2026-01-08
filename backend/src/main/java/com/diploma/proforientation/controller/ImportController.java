package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.importexport.ImportResultDto;
import com.diploma.proforientation.service.impl.ExcelImportServiceImpl;
import io.swagger.v3.oas.annotations.Operation;
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
    private final ExcelImportServiceImpl excelImportService;

    @PostMapping(value = "/excel/translations", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import translations from Excel",
            description = """
        Imports translations from an Excel (.xlsx) file.

        The file must contain a header row with the following columns:
        - entity_type (quiz, question, option, profession)
        - entity_id
        - field (e.g. title, description)
        - locale (e.g. en, uk)
        - text

        Import behavior:
        - All rows are validated before saving
        - Invalid rows are skipped
        - Errors are returned with row numbers and messages
        - Valid rows are saved in a single transaction
        """
    )
    @ApiResponse(responseCode = "200", description = "Translations imported successfully")
    @ApiResponse(responseCode = "400", description = "Invalid Excel file or validation errors")
    @ApiResponse(responseCode = "403", description = "Access denied (admin only)")
    public ImportResultDto importTranslationsExcel(@RequestPart MultipartFile file) {
        return excelImportService.importTranslations(file);
    }

    @PostMapping(value = "/excel/quizzes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import quizzes from Excel",
            description = """
        Imports quizzes from an Excel (.xlsx) file.

        Required columns:
        - code
        - title_default
        - category_id
        - author_id

        Optional columns:
        - status (DRAFT, PUBLISHED)
        - processing_mode (LLM, ML_RIASEC, etc.)
        - description_default
        - seconds_per_question_default

        Import behavior:
        - Existing quizzes are updated by code
        - New quizzes are created if code does not exist
        - Duplicate codes inside the file are rejected
        - If status is PUBLISHED and no quiz version exists, 
          a published quiz version is created automatically
        - Invalid rows are skipped, valid rows are saved
        """
    )
    @ApiResponse(responseCode = "200", description = "Quizzes imported successfully")
    @ApiResponse(responseCode = "400", description = "Invalid Excel file or validation errors")
    @ApiResponse(responseCode = "403", description = "Access denied (admin only)")
    public ImportResultDto importQuizzesExcel(@RequestPart MultipartFile file) {
        return excelImportService.importQuizzes(file);
    }

    @PostMapping(value = "/excel/professions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import professions from Excel",
            description = """
        Imports professions from an Excel (.xlsx) file.

        Required columns:
        - code
        - title_default
        - category_id

        Optional columns:
        - description
        - ml_class_code

        Import behavior:
        - Existing professions are updated by code
        - New professions are created if code does not exist
        - Duplicate codes inside the file are rejected
        - Invalid rows are skipped, valid rows are saved
        """
    )
    @ApiResponse(responseCode = "200", description = "Professions imported successfully")
    @ApiResponse(responseCode = "400", description = "Invalid Excel file or validation errors")
    @ApiResponse(responseCode = "403", description = "Access denied (admin only)")
    public ImportResultDto importProfessionsExcel(@RequestPart MultipartFile file) {
        return excelImportService.importProfessions(file);
    }

    @PostMapping(value = "/admin/import/questions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Import quiz questions from Excel",
            description = """
        Imports quiz questions from an Excel (.xlsx) file.

        Required columns:
        - quiz_version_id
        - ord
        - qtype (SINGLE, MULTIPLE, SCALE, etc.)
        - text_default

        Import behavior:
        - Questions are linked to an existing quiz version
        - Invalid enum values or missing references are rejected
        - Invalid rows are skipped
        - Valid questions are saved
        """
    )
    @ApiResponse(responseCode = "200", description = "Questions imported successfully")
    @ApiResponse(responseCode = "400", description = "Invalid Excel file or validation errors")
    @ApiResponse(responseCode = "403", description = "Access denied (admin only)")
    public ImportResultDto importQuestions(@RequestPart MultipartFile file) {
        return excelImportService.importQuestions(file);
    }
}

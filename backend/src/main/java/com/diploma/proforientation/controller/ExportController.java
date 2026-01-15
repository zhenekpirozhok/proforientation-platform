package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.service.ExportService;
import com.diploma.proforientation.util.rate.RateLimit;
import com.google.common.net.HttpHeaders;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Data export operations (CSV / Excel)")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/excel")
    @Operation(
            summary = "Export all data to Excel",
            description = """
                    Exports all system data into a single Excel file.
                    Each entity is exported into a separate sheet.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Excel file generated successfully",
            content = @Content(
                    mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
    )
    @RateLimit(requests = 2, durationSeconds = 60)
    public ResponseEntity<byte[]> exportExcel() {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=data.xlsx")
                .body(exportService.exportAllToExcel());
    }

    @GetMapping("/csv/{entity}")
    @Operation(
            summary = "Export entity to CSV",
            description = """
                    Exports the specified entity to a CSV file.
                    Supported entities include quizzes, questions, options,
                    professions, attempts, and translations.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "CSV file generated successfully",
            content = @Content(mediaType = "text/csv")
    )
    @ApiResponse(
            responseCode = "400",
            description = "Unsupported entity type",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    @RateLimit(requests = 3, durationSeconds = 60)
    public ResponseEntity<byte[]> exportCsv(
            @PathVariable
            @Parameter(
                    description = "Entity name to export",
                    example = "questions",
                    schema = @Schema(
                            type = "string",
                            allowableValues = {
                                    "quizzes",
                                    "quiz_versions",
                                    "questions",
                                    "question_options",
                                    "professions",
                                    "attempts",
                                    "translations"
                            }
                    )
            )
            String entity) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=" + entity + ".csv")
                .body(exportService.exportEntityToCsv(entity));
    }

    @GetMapping(value = "/quiz-metrics/export", produces = "text/csv")
    @Operation(
            summary = "Export quiz metrics to CSV",
            description = "Exports quiz public metrics filtered by query parameters. All filters are optional."
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportQuizMetricsCsv(QuizMetricsFilter filter) {
        byte[] bytes = exportService.exportQuizMetricsToCsv(filter);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=quiz_metrics.csv")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(bytes);
    }

    @GetMapping(
            value = "/quiz-metrics/export.xlsx",
            produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    @Operation(
            summary = "Export quiz metrics to Excel (XLSX)",
            description = "Exports quiz public metrics filtered by query parameters. All filters are optional."
    )
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportQuizMetricsExcel(QuizMetricsFilter filter) {
        byte[] bytes = exportService.exportQuizMetricsToExcel(filter);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=quiz_metrics.xlsx")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }
}

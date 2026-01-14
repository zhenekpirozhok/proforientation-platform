package com.diploma.proforientation.controller;

import com.diploma.proforientation.service.ExportService;
import com.google.common.net.HttpHeaders;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/quizzes/{quizId}/analytics/export")
@RequiredArgsConstructor
@Tag(name = "Admin Analytics Export", description = "Export Admin Analytics per quiz as EXCEL/CSV")
public class QuizAnalyticsExportController {

    private final ExportService exportService;

    @GetMapping(value = "/overview.csv", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Export quiz analytics overview as CSV",
            description = "Exports aggregated quiz analytics data for a specific quiz version in CSV format. " +
                    "Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz analytics overview exported as CSV",
            content = @Content(mediaType = "text/csv",
                    schema = @Schema(type = "string", format = "binary"))
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public ResponseEntity<byte[]> overviewCsv(@PathVariable Integer quizId,
                                              @RequestParam Integer quizVersionId) {
        byte[] data = exportService.exportQuizAnalyticsOverviewCsv(quizId, quizVersionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quiz_overview.csv\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(data);
    }

    @GetMapping(value = "/detailed.csv", produces = "text/csv")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Export detailed quiz analytics as CSV",
            description = "Exports detailed analytics data for a specific quiz version, including per-question statistics, " +
                    "in CSV format. Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Detailed quiz analytics exported as CSV",
            content = @Content(mediaType = "text/csv",
                    schema = @Schema(type = "string", format = "binary"))
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public ResponseEntity<byte[]> detailedCsv(@PathVariable Integer quizId,
                                              @RequestParam Integer quizVersionId) {
        byte[] data = exportService.exportQuizAnalyticsDetailedCsv(quizId, quizVersionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quiz_detailed.csv\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(data);
    }

    @GetMapping(value = "/overview.xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Export quiz analytics overview as Excel",
            description = "Exports aggregated quiz analytics data for a specific quiz version in Excel (XLSX) format. " +
                    "Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz analytics overview exported as Excel file",
            content = @Content(
                    mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    schema = @Schema(type = "string", format = "binary")
            )
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public ResponseEntity<byte[]> overviewXlsx(@PathVariable Integer quizId,
                                               @RequestParam Integer quizVersionId) {
        byte[] data = exportService.exportQuizAnalyticsOverviewExcel(quizId, quizVersionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quiz_overview.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }

    @GetMapping(value = "/detailed.xlsx", produces = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Export detailed quiz analytics as Excel",
            description = "Exports detailed analytics data for a specific quiz version, including per-question statistics, " +
                    "in Excel (XLSX) format. Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Detailed quiz analytics exported as Excel file",
            content = @Content(
                    mediaType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    schema = @Schema(type = "string", format = "binary")
            )
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public ResponseEntity<byte[]> detailedXlsx(@PathVariable Integer quizId,
                                               @RequestParam Integer quizVersionId) {
        byte[] data = exportService.exportQuizAnalyticsDetailedExcel(quizId, quizVersionId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"quiz_detailed.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}
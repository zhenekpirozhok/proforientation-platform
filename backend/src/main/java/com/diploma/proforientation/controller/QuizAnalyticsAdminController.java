package com.diploma.proforientation.controller;


import com.diploma.proforientation.dto.analytics.QuizAnalyticsDetailedDto;
import com.diploma.proforientation.dto.analytics.QuizAnalyticsOverviewDto;
import com.diploma.proforientation.service.QuizAnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/admin/quizzes/{quizId}/analytics")
@RequiredArgsConstructor
@Tag(name = "Admin Analytics", description = "Get Admin Analytics per quiz")
public class QuizAnalyticsAdminController {

    private final QuizAnalyticsService service;

    @GetMapping("/overview")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get quiz analytics overview",
            description = "Returns aggregated analytics data for a quiz version, including completion counts and average results. " +
                    "Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz analytics overview returned",
            content = @Content(schema = @Schema(implementation = QuizAnalyticsOverviewDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request parameters")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public QuizAnalyticsOverviewDto overview(
            @PathVariable Integer quizId,
            @RequestParam Integer quizVersionId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        return service.getOverview(quizId, quizVersionId, from, to);
    }

    @GetMapping("/detailed")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get detailed quiz analytics",
            description = "Returns detailed analytics for a quiz version, including per-question statistics and user answers. " +
                    "Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Detailed quiz analytics returned",
            content = @Content(schema = @Schema(implementation = QuizAnalyticsDetailedDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid request parameters")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public QuizAnalyticsDetailedDto detailed(
            @PathVariable Integer quizId,
            @RequestParam Integer quizVersionId
    ) {
        return service.getDetailed(quizId, quizVersionId);
    }
}
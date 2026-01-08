package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.dto.QuizPublicMetricsDto;
import com.diploma.proforientation.service.QuizMetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quizzes/metrics")
@RequiredArgsConstructor
@Tag(name = "Quiz Metrics", description = "Get metrics for quizzes")
public class QuizMetricsController {

    private final QuizMetricsService service;

    @GetMapping
    @Operation(
            summary = "Get all public quiz metrics",
            description = "Returns public analytics for all quizzes without filtering. " +
                    "Includes attempts count, average duration, and estimated duration."
    )
    public List<QuizPublicMetricsDto> getAllMetrics() {
        return service.getAllPublicMetrics();
    }

    @GetMapping("/{quizId}")
    @Operation(
            summary = "Get public metrics for a specific quiz",
            description = "Returns aggregated public metrics for a single quiz identified by its ID. " +
                    "Throws 404 if the quiz metrics are not found."
    )
    public QuizPublicMetricsDto getMetrics(
            @PathVariable Integer quizId
    ) {
        return service.getMetricsForQuiz(quizId);
    }

    @GetMapping("/filter")
    @Operation(
            summary = "Filter public quiz metrics",
            description = """
                    Returns public quiz metrics filtered by the provided criteria.
                    
                    All parameters are optional. If multiple filters are provided,
                    they are combined using logical AND.
                    
                    Typical use cases:
                    - Admin analytics dashboards
                    - Exporting filtered analytics
                    - Monitoring quiz performance
                    """
    )
    public List<QuizPublicMetricsDto> filterMetrics(
            @Parameter(description = "Filter criteria for quiz metrics")
            QuizMetricsFilter filter
    ) {
        return service.getPublicMetrics(filter);
    }
}

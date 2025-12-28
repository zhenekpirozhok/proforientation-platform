package com.diploma.proforientation.controller;

import com.diploma.proforientation.model.view.QuizPublicMetricsView;
import com.diploma.proforientation.service.QuizMetricsService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/quizzes/metrics")
@RequiredArgsConstructor
public class QuizMetricsController {

    private final QuizMetricsService service;

    @GetMapping
    @Operation(summary = "Get public quiz metrics")
    public List<QuizPublicMetricsView> getAllMetrics() {
        return service.getAllPublicMetrics();
    }

    @GetMapping("/{quizId}")
    @Operation(summary = "Get public metrics for a quiz")
    public QuizPublicMetricsView getMetrics(
            @PathVariable Integer quizId
    ) {
        return service.getMetricsForQuiz(quizId);
    }
}

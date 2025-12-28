package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.model.view.QuizPublicMetricsView;
import com.diploma.proforientation.repository.QuizPublicMetricsRepository;
import com.diploma.proforientation.service.QuizMetricsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static com.diploma.proforientation.util.Constants.QUIZ_METRICS_NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizMetricsServiceImpl implements QuizMetricsService {

    private final QuizPublicMetricsRepository repository;

    public List<QuizPublicMetricsView> getAllPublicMetrics() {
        return repository.findAllMetrics();
    }

    public QuizPublicMetricsView getMetricsForQuiz(Integer quizId) {
        return repository.findByQuizId(quizId)
                .orElseThrow(() ->
                        new EntityNotFoundException(QUIZ_METRICS_NOT_FOUND));
    }
}

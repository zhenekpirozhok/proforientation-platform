package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.QuizPublicMetricsDto;
import com.diploma.proforientation.model.view.QuizPublicMetricsEntity;
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

    @Override
    public List<QuizPublicMetricsDto> getAllPublicMetrics() {
        return repository.findAll().stream()
                .map(QuizPublicMetricsDto::from)
                .toList();
    }

    @Override
    public QuizPublicMetricsDto getMetricsForQuiz(Integer quizId) {
        QuizPublicMetricsEntity e = repository.findById(quizId)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_METRICS_NOT_FOUND));
        return QuizPublicMetricsDto.from(e);
    }
}

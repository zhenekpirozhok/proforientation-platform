package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.model.view.QuizPublicMetricsView;
import com.diploma.proforientation.repository.QuizPublicMetricsRepository;
import com.diploma.proforientation.service.impl.QuizMetricsServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuizMetricsServiceTest {

    @Mock
    private QuizPublicMetricsRepository repository;

    @InjectMocks
    private QuizMetricsServiceImpl service;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getAll_shouldReturnMetricsList() {
        QuizPublicMetricsView view = mock(QuizPublicMetricsView.class);

        when(repository.findAllMetrics())
                .thenReturn(List.of(view));

        List<QuizPublicMetricsView> result = service.getAllPublicMetrics();

        assertThat(result).hasSize(1);
        verify(repository).findAllMetrics();
    }

    @Test
    void getByQuizId_shouldReturnMetrics() {
        QuizPublicMetricsView view = mock(QuizPublicMetricsView.class);

        when(repository.findByQuizId(5))
                .thenReturn(Optional.of(view));

        QuizPublicMetricsView result = service.getMetricsForQuiz(5);

        assertThat(result).isNotNull();
        verify(repository).findByQuizId(5);
    }

    @Test
    void getByQuizId_shouldFailWhenNotFound() {
        when(repository.findByQuizId(999))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getMetricsForQuiz(999))
                .isInstanceOf(EntityNotFoundException.class);

        verify(repository).findByQuizId(999);
    }
}
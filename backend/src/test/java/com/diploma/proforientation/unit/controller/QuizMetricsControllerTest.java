package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuizMetricsController;
import com.diploma.proforientation.model.view.QuizPublicMetricsView;
import com.diploma.proforientation.service.impl.QuizMetricsServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class QuizMetricsControllerTest {

    @Mock
    private QuizMetricsServiceImpl service;

    @InjectMocks
    private QuizMetricsController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getAll_shouldReturnMetricsList() {
        QuizPublicMetricsView view = mock(QuizPublicMetricsView.class);

        when(view.getQuizId()).thenReturn(1);
        when(view.getQuizCode()).thenReturn("quiz_1");
        when(view.getQuestionsTotal()).thenReturn(48);
        when(view.getAttemptsSubmitted()).thenReturn(30);
        when(view.getEstimatedDurationSeconds()).thenReturn(600);

        when(service.getAllPublicMetrics())
                .thenReturn(List.of(view));

        List<QuizPublicMetricsView> result = controller.getAllMetrics();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getQuizId()).isEqualTo(1);
        assertThat(result.getFirst().getEstimatedDurationSeconds()).isEqualTo(600);

        verify(service).getAllPublicMetrics();
    }

    @Test
    void getByQuizId_shouldReturnMetrics() {
        QuizPublicMetricsView view = mock(QuizPublicMetricsView.class);

        when(view.getQuizId()).thenReturn(5);
        when(view.getAttemptsTotal()).thenReturn(100);

        when(service.getMetricsForQuiz(5))
                .thenReturn(view);

        QuizPublicMetricsView result = controller.getMetrics(5);

        assertThat(result.getQuizId()).isEqualTo(5);
        assertThat(result.getAttemptsTotal()).isEqualTo(100);

        verify(service).getMetricsForQuiz(5);
    }

    @Test
    void getByQuizId_shouldPropagateNotFound() {
        when(service.getMetricsForQuiz(999))
                .thenThrow(new EntityNotFoundException());

        assertThatThrownBy(() -> controller.getMetrics(999))
                .isInstanceOf(EntityNotFoundException.class);

        verify(service).getMetricsForQuiz(999);
    }
}

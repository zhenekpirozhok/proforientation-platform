package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuizMetricsController;
import com.diploma.proforientation.dto.QuizPublicMetricsDto;
import com.diploma.proforientation.service.QuizMetricsService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class QuizMetricsControllerTest {

    @Mock
    private QuizMetricsService service;

    @InjectMocks
    private QuizMetricsController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getAllMetrics_returnsListFromService() {
        QuizPublicMetricsDto dto = new QuizPublicMetricsDto(
                1,
                "quiz_1",
                "PUBLISHED",
                2,
                48,
                120,
                30,
                BigDecimal.valueOf(650.5),
                600
        );

        when(service.getAllPublicMetrics()).thenReturn(List.of(dto));

        List<QuizPublicMetricsDto> result = controller.getAllMetrics();

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().quizId()).isEqualTo(1);
        assertThat(result.getFirst().estimatedDurationSeconds()).isEqualTo(600);

        verify(service).getAllPublicMetrics();
        verifyNoMoreInteractions(service);
    }

    @Test
    void getMetrics_returnsDtoFromService() {
        QuizPublicMetricsDto dto = new QuizPublicMetricsDto(
                5,
                "quiz_5",
                "PUBLISHED",
                3,
                40,
                100,
                80,
                BigDecimal.valueOf(720.0),
                700
        );

        when(service.getMetricsForQuiz(5)).thenReturn(dto);

        QuizPublicMetricsDto result = controller.getMetrics(5);

        assertThat(result.quizId()).isEqualTo(5);
        assertThat(result.attemptsTotal()).isEqualTo(100);

        verify(service).getMetricsForQuiz(5);
        verifyNoMoreInteractions(service);
    }

    @Test
    void getMetrics_propagatesEntityNotFound() {
        when(service.getMetricsForQuiz(999))
                .thenThrow(new EntityNotFoundException("not found"));

        assertThatThrownBy(() -> controller.getMetrics(999))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("not found");

        verify(service).getMetricsForQuiz(999);
        verifyNoMoreInteractions(service);
    }
}
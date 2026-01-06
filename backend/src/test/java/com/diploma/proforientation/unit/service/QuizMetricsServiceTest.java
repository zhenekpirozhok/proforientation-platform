package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.QuizPublicMetricsDto;
import com.diploma.proforientation.model.view.QuizPublicMetricsEntity;
import com.diploma.proforientation.repository.QuizPublicMetricsRepository;
import com.diploma.proforientation.service.impl.QuizMetricsServiceImpl;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static com.diploma.proforientation.util.Constants.QUIZ_METRICS_NOT_FOUND;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
    void getAllPublicMetrics_returnsDtosMappedFromEntities() {
        QuizPublicMetricsEntity e = new QuizPublicMetricsEntity();
        e.setQuizId(1);
        e.setQuizCode("quiz_1");
        e.setQuizStatus("PUBLISHED");
        e.setCategoryId(2);
        e.setQuestionsTotal(48);
        e.setAttemptsTotal(120);
        e.setAttemptsSubmitted(30);
        e.setAvgDurationSeconds(BigDecimal.valueOf(650.5));
        e.setEstimatedDurationSeconds(600);

        when(repository.findAll()).thenReturn(List.of(e));

        List<QuizPublicMetricsDto> result = service.getAllPublicMetrics();

        assertThat(result).hasSize(1);
        QuizPublicMetricsDto dto = result.getFirst();

        assertThat(dto.quizId()).isEqualTo(1);
        assertThat(dto.quizCode()).isEqualTo("quiz_1");
        assertThat(dto.estimatedDurationSeconds()).isEqualTo(600);

        verify(repository).findAll();
        verifyNoMoreInteractions(repository);
    }

    @Test
    void getMetricsForQuiz_returnsDtoWhenFound() {
        QuizPublicMetricsEntity e = new QuizPublicMetricsEntity();
        e.setQuizId(5);
        e.setQuizCode("quiz_5");
        e.setAttemptsTotal(100);
        e.setEstimatedDurationSeconds(700);

        when(repository.findById(5)).thenReturn(Optional.of(e));

        QuizPublicMetricsDto dto = service.getMetricsForQuiz(5);

        assertThat(dto).isNotNull();
        assertThat(dto.quizId()).isEqualTo(5);
        assertThat(dto.attemptsTotal()).isEqualTo(100);

        verify(repository).findById(5);
        verifyNoMoreInteractions(repository);
    }

    @Test
    void getMetricsForQuiz_throwsEntityNotFoundWhenMissing() {
        when(repository.findById(999)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getMetricsForQuiz(999))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining(QUIZ_METRICS_NOT_FOUND);

        verify(repository).findById(999);
        verifyNoMoreInteractions(repository);
    }
}
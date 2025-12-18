package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.ml.MlPrediction;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.service.scoring.ml.MlClient;
import com.diploma.proforientation.service.scoring.ml.TraitScoreCalculator;
import com.diploma.proforientation.service.scoring.ml.impl.MlResultMapper;
import com.diploma.proforientation.service.scoring.ml.impl.MlScoringEngineImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class MlScoringEngineTest {

    @Mock
    private AnswerRepository answerRepo;

    @Mock
    private TraitScoreCalculator traitCalculator;

    @Mock
    private MlClient mlClient;

    @Mock
    private MlResultMapper mlMapper;

    @InjectMocks
    private MlScoringEngineImpl engine;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    private List<Integer> createAnswers() {
        return Collections.nCopies(48, 3); // always 3 → normalized = (3-1)/4 = 0.50
    }

    @Test
    void evaluate_shouldCallMlAndTraitCalc_andReturnScoringResult() {

        int attemptId = 10;
        List<Integer> answers = createAnswers();

        when(answerRepo.findValuesByAttemptId(attemptId)).thenReturn(answers);

        MlResultResponse mlResponse = new MlResultResponse(
                "Computer Science",
                List.of(new MlPrediction("Computer Science", BigDecimal.valueOf(0.9)))
        );

        when(mlClient.predict(any())).thenReturn(mlResponse);

        List<RecommendationDto> mapped = List.of(
                new RecommendationDto(1, BigDecimal.valueOf(0.9), null)
        );

        when(mlMapper.toRecommendations(mlResponse)).thenReturn(mapped);

        TraitProfile traitR = new TraitProfile();
        traitR.setId(1);
        traitR.setCode("R");

        Map<TraitProfile, BigDecimal> traitScores = Map.of(
                traitR, BigDecimal.valueOf(10)
        );

        when(traitCalculator.calculateScores(attemptId)).thenReturn(traitScores);

        ScoringResult result = engine.evaluate(attemptId);

        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.traitScores()).hasSize(1);

        ArgumentCaptor<List<BigDecimal>> cap = ArgumentCaptor.forClass(List.class);
        verify(mlClient).predict(cap.capture());

        List<BigDecimal> normalized = cap.getValue();

        assertThat(normalized).hasSize(48);
        assertThat(normalized.getFirst()).isEqualTo("0.500000"); // (3-1)/4

        verify(traitCalculator).calculateScores(attemptId);
    }

    @Test
    void evaluate_shouldThrowWhenNot48Answers() {
        when(answerRepo.findValuesByAttemptId(99)).thenReturn(List.of(1, 2, 3));

        assertThatThrownBy(() -> engine.evaluate(99))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("requires exactly 48");
    }

    @Test
    void evaluateRaw_shouldReturnRecommendationsAndEmptyTraitMap() {

        List<Integer> answers = createAnswers();

        MlResultResponse mlResponse = new MlResultResponse(
                "Physics",
                List.of(new MlPrediction("Physics", BigDecimal.valueOf(0.7)))
        );

        when(mlClient.predict(any())).thenReturn(mlResponse);

        List<RecommendationDto> mapped = List.of(
                new RecommendationDto(5, BigDecimal.valueOf(0.7), null)
        );

        when(mlMapper.toRecommendations(mlResponse)).thenReturn(mapped);

        ScoringResult result = engine.evaluateRaw(answers);

        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.traitScores()).isEmpty();

        ArgumentCaptor<List<BigDecimal>> cap = ArgumentCaptor.forClass(List.class);
        verify(mlClient).predict(cap.capture());

        assertThat(cap.getValue().getFirst()).isEqualTo("0.500000");
    }

    @Test
    void evaluateRaw_shouldThrowWhenNot48Answers() {

        List<Integer> invalid = List.of(1, 2, 3);

        assertThatThrownBy(() -> engine.evaluateRaw(invalid))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("48");
    }
}
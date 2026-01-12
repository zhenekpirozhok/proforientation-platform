package com.diploma.proforientation.scoring.ml.impl;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.scoring.ml.MlClient;
import com.diploma.proforientation.scoring.ml.MlScoringEngine;
import com.diploma.proforientation.scoring.TraitScoreCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

import static com.diploma.proforientation.util.Constants.RIASEC_INVALID_ANSWER_COUNT;

@Service
@RequiredArgsConstructor
public class MlScoringEngineImpl implements MlScoringEngine {

    private final AnswerRepository answerRepo;
    private final TraitScoreCalculator traitCalculator;
    private final MlClient mlClient;
    private final MlResultMapper mlMapper;

    @Override
    public ScoringResult evaluate(Integer attemptId) {

        // 1. Load answers from DB
        List<Integer> answers = answerRepo.findValuesByAttemptId(attemptId);

        // 2. Evaluate ML part (shared logic)
        MlResultResponse mlResponse = evaluateMl(answers);
        List<RecommendationDto> recs = mlMapper.toRecommendations(mlResponse);

        // 3. Compute DB-based trait scores (only for full evaluate)
        Map<TraitProfile, BigDecimal> traitScores =
                traitCalculator.calculateScores(attemptId);

        // 4. Construct final scoring result
        return new ScoringResult(traitScores, recs);
    }

    public ScoringResult evaluateRaw(List<Integer> answers) {

        MlResultResponse mlResponse = evaluateMl(answers);
        List<RecommendationDto> recs = mlMapper.toRecommendations(mlResponse);

        return new ScoringResult(Map.of(), recs);
    }

    private MlResultResponse evaluateMl(List<Integer> answers) {
        validateAnswers(answers);
        List<BigDecimal> normalized = normalizeAnswers(answers);
        return mlClient.predict(normalized);
    }

    private void validateAnswers(List<Integer> answers) {
        if (answers.size() != 48) {
            throw new IllegalStateException(RIASEC_INVALID_ANSWER_COUNT);
        }
    }

    private List<BigDecimal> normalizeAnswers(List<Integer> answers) {
        return answers.stream()
                .map(a -> BigDecimal.valueOf(a - 1)
                        .divide(BigDecimal.valueOf(4), 6, RoundingMode.HALF_UP))
                .toList();
    }
}
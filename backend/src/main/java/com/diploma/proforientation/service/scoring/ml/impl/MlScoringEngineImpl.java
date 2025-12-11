package com.diploma.proforientation.service.scoring.ml.impl;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.service.scoring.ScoringResult;
import com.diploma.proforientation.service.scoring.ml.MlClient;
import com.diploma.proforientation.service.scoring.ml.MlScoringEngine;
import com.diploma.proforientation.service.scoring.ml.TraitScoreCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MlScoringEngineImpl implements MlScoringEngine {

    private final AnswerRepository answerRepo;
    private final TraitScoreCalculator traitCalculator;
    private final MlClient mlClient;
    private final MlResultMapper mlMapper;

    @Override
    public ScoringResult evaluate(Integer attemptId) {

        // 1. Get raw answers (1-5)
        List<Integer> answers = answerRepo.findValuesByAttemptId(attemptId);

        if (answers.size() != 48) {
            throw new IllegalStateException("RIASEC ML requires exactly 48 answers");
        }

        // 2. Normalize for ML: (x - 1) / 4
        List<BigDecimal> normalized = answers.stream()
                .map(a -> BigDecimal.valueOf(a - 1).divide(BigDecimal.valueOf(4), 6, RoundingMode.HALF_UP))
                .toList();

        // 3. Get ML prediction
        MlResultResponse mlResponse = mlClient.predict(normalized);

        // 4. Convert to RecommendationDto
        List<RecommendationDto> recs = mlMapper.toRecommendations(mlResponse);

        // 5. Compute R/I/A/S/E/C using DB trait weights
        Map<TraitProfile, BigDecimal> traitScores =
                traitCalculator.calculateScores(attemptId);

        // 6. Combine into ScoringResult
        return new ScoringResult(traitScores, recs);
    }

    public ScoringResult evaluateRaw(List<Integer> answers) {

        if (answers.size() != 48) {
            throw new IllegalStateException("RIASEC ML requires exactly 48 answers");
        }

        List<BigDecimal> normalized = answers.stream()
                .map(a -> BigDecimal.valueOf(a - 1)
                        .divide(BigDecimal.valueOf(4), 6, RoundingMode.HALF_UP))
                .toList();

        MlResultResponse mlResponse = mlClient.predict(normalized);
        List<RecommendationDto> recs = mlMapper.toRecommendations(mlResponse);

        // No DB trait weights here → return empty trait map
        return new ScoringResult(Map.of(), recs);
    }
}
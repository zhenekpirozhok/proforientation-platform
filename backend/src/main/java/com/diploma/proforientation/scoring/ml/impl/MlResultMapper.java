package com.diploma.proforientation.scoring.ml.impl;

import com.diploma.proforientation.dto.ml.MlPrediction;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.repository.ProfessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MlResultMapper {
    private static final String EXPLANATION_PREFIX = "Predicted as: ";

    private final ProfessionRepository professionRepository;

    public List<RecommendationDto> toRecommendations(MlResultResponse ml) {
        return ml.top_5_predictions().stream()
                .map(this::mapPrediction)
                .toList();
    }

    private RecommendationDto mapPrediction(MlPrediction p) {

        Integer professionId = professionRepository
                .findIdByMlClassCode(p.major())
                .orElse(null);

        return new RecommendationDto(
                professionId,
                p.probability(),
                EXPLANATION_PREFIX + p.major()
        );
    }
}
package com.diploma.proforientation.service.scoring.ml.impl;

import com.diploma.proforientation.dto.MlPrediction;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.repository.ProfessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class MlResultMapper {

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
                "Predicted as: " + p.major()
        );
    }
}
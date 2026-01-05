package com.diploma.proforientation.scoring.ml.impl;

import com.diploma.proforientation.dto.ml.MlPrediction;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.repository.ProfessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MlResultMapper {

    private static String DEFAULT_EXPLANATION = "Recommended based on machine learning prediction.";

    private final ProfessionRepository professionRepository;
    private final MlProfessionExplanationServiceImpl explanationService;

    public List<RecommendationDto> toRecommendations(MlResultResponse ml) {

        if (ml == null || ml.top_5_predictions() == null) {
            return List.of();
        }

        Map<Integer, RecommendationSeed> seeds = new LinkedHashMap<>();

        for (MlPrediction p : ml.top_5_predictions()) {
            professionRepository.findIdByMlClassCode(p.major())
                    .ifPresent(id ->
                            seeds.put(id, new RecommendationSeed(id, p.probability()))
                    );
        }

        if (seeds.isEmpty()) {
            return List.of();
        }

        List<Profession> professions =
                professionRepository.findAllById(seeds.keySet());

        Map<Integer, String> explanations =
                explanationService.explainProfessions(professions);

        return professions.stream()
                .map(p -> {
                    RecommendationSeed seed = seeds.get(p.getId());
                    return new RecommendationDto(
                            p.getId(),
                            seed.score(),
                            explanations.getOrDefault(
                                    p.getId(),
                                    DEFAULT_EXPLANATION
                            )
                    );
                })
                .toList();
    }

    private record RecommendationSeed(Integer professionId, java.math.BigDecimal score) {}
}
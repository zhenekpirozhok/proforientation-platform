package com.diploma.proforientation.service.scoring;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.model.TraitProfile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record ScoringResult(
        Map<TraitProfile, BigDecimal> traitScores,
        List<RecommendationDto> recommendations
) {}
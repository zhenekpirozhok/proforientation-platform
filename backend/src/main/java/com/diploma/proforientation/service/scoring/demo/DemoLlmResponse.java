package com.diploma.proforientation.service.scoring.demo;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.model.TraitProfile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DemoLlmResponse(
        Map<TraitProfile, BigDecimal> traits,
        List<RecommendationDto> recommendations,
        String rawModelOutput
) {}
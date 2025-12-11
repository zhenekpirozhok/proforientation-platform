package com.diploma.proforientation.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record AttemptResultDto(
        Map<String, BigDecimal> traitScores,
        List<RecommendationDto> recommendations
) {}
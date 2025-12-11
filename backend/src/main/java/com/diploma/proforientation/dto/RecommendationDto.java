package com.diploma.proforientation.dto;

import java.math.BigDecimal;

public record RecommendationDto(
        Integer professionId,
        BigDecimal score,
        String explanation
) {}
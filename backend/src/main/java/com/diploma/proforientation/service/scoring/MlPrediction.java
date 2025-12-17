package com.diploma.proforientation.service.scoring;

import java.math.BigDecimal;

public record MlPrediction(String major, BigDecimal probability) {}

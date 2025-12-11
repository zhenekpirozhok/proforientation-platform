package com.diploma.proforientation.service.scoring.ml;

import com.diploma.proforientation.model.TraitProfile;

import java.math.BigDecimal;
import java.util.Map;

public interface TraitScoreCalculator {
    Map<TraitProfile, BigDecimal> calculateScores(Integer attemptId);
}
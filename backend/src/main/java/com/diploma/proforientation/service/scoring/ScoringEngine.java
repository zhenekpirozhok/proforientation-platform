package com.diploma.proforientation.service.scoring;

import com.diploma.proforientation.dto.ml.ScoringResult;

public interface ScoringEngine {
    ScoringResult evaluate(Integer attemptId);
}
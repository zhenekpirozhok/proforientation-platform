package com.diploma.proforientation.scoring.impl;

import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.scoring.ScoringEngine;
import com.diploma.proforientation.scoring.llm.LlmScoringEngine;
import com.diploma.proforientation.scoring.ml.MlScoringEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScoringEngineFactory {

    private final MlScoringEngine mlEngine;
    private final LlmScoringEngine llmEngine;

    public ScoringEngine getEngine(QuizProcessingMode mode) {
        return switch (mode) {
            case ML_RIASEC -> mlEngine;
            default -> llmEngine;
        };
    }
}

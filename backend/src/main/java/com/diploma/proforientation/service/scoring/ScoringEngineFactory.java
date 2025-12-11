package com.diploma.proforientation.service.scoring;

import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.service.scoring.llm.LlmScoringEngine;
import com.diploma.proforientation.service.scoring.ml.MlScoringEngine;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScoringEngineFactory {

    private final MlScoringEngine mlEngine;
    private final LlmScoringEngine llmEngine;

    public ScoringEngine getEngine(QuizProcessingMode mode) {
        return switch (mode) {
            case ml_riasec -> mlEngine;
            default -> llmEngine;
        };
    }
}

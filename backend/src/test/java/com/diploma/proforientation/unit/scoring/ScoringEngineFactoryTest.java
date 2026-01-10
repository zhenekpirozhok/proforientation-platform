package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.scoring.ScoringEngine;
import com.diploma.proforientation.scoring.impl.ScoringEngineFactory;
import com.diploma.proforientation.scoring.llm.LlmScoringEngine;
import com.diploma.proforientation.scoring.ml.MlScoringEngine;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.assertj.core.api.Assertions.assertThat;

class ScoringEngineFactoryTest {

    @Mock
    private MlScoringEngine mlEngine;

    @Mock
    private LlmScoringEngine llmEngine;

    @InjectMocks
    private ScoringEngineFactory factory;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void getEngine_shouldReturnMlEngine_forMlRiasec() {
        ScoringEngine engine =
                factory.getEngine(QuizProcessingMode.ML_RIASEC);

        assertThat(engine).isSameAs(mlEngine);
    }

    @Test
    void getEngine_shouldReturnLlmEngine_forOtherModes() {
        ScoringEngine engine =
                factory.getEngine(QuizProcessingMode.LLM);

        assertThat(engine).isSameAs(llmEngine);
    }
}
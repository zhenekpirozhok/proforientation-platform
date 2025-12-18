package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.service.scoring.ScoringEngine;
import com.diploma.proforientation.service.scoring.ScoringEngineFactory;
import com.diploma.proforientation.service.scoring.llm.LlmScoringEngine;
import com.diploma.proforientation.service.scoring.ml.MlScoringEngine;
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
                factory.getEngine(QuizProcessingMode.ml_riasec);

        assertThat(engine).isSameAs(mlEngine);
    }

    @Test
    void getEngine_shouldReturnLlmEngine_forOtherModes() {
        ScoringEngine engine =
                factory.getEngine(QuizProcessingMode.llm);

        assertThat(engine).isSameAs(llmEngine);
    }
}
package com.diploma.proforientation.integration.ml;

import com.diploma.proforientation.config.MlClientConfig;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.scoring.ml.TraitScoreCalculator;
import com.diploma.proforientation.scoring.ml.impl.MlClientImpl;
import com.diploma.proforientation.scoring.ml.impl.MlResultMapper;
import com.diploma.proforientation.scoring.ml.impl.MlScoringEngineImpl;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(
        properties = {
                "ml.api.url=http://localhost:${wiremock.server.port}"
        },
        classes = {
                MlClientConfig.class,
                MlClientImpl.class,
                MlResultMapper.class,
                MlScoringEngineImpl.class
        }
)
@AutoConfigureWireMock(port = 0)
@EnableAutoConfiguration(exclude = {
        DataSourceAutoConfiguration.class,
        HibernateJpaAutoConfiguration.class
})
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
class MlFullFlowIntegrationTest {

    @Autowired
    MlScoringEngineImpl scoringEngine;

    @MockitoBean
    AnswerRepository answerRepository;

    @MockitoBean
    ProfessionRepository professionRepository;

    @MockitoBean
    TraitScoreCalculator traitScoreCalculator;

    @Test
    void fullFlow_answersToRecommendations() {

        // ML service stub
        stubFor(post("/predict")
                .willReturn(okJson("""
                    {
                      "top_5_predictions": [
                        { "major": "SE", "probability": 0.80 },
                        { "major": "DS", "probability": 0.60 }
                      ]
                    }
                """)));

        // DB stubs
        Mockito.when(answerRepository.findValuesByAttemptId(1))
                .thenReturn(java.util.Collections.nCopies(48, 3));

        Mockito.when(professionRepository.findIdByMlClassCode("SE"))
                .thenReturn(java.util.Optional.of(10));

        Mockito.when(professionRepository.findIdByMlClassCode("DS"))
                .thenReturn(java.util.Optional.of(20));

        Mockito.when(traitScoreCalculator.calculateScores(1))
                .thenReturn(java.util.Map.of());


        ScoringResult result = scoringEngine.evaluate(1);


        List<RecommendationDto> recs = result.recommendations();

        assertThat(recs).hasSize(2);

        assertThat(recs.get(0).professionId()).isEqualTo(10);
        assertThat(recs.get(0).score()).isEqualTo("0.80");

        assertThat(recs.get(1).professionId()).isEqualTo(20);
        assertThat(recs.get(1).score()).isEqualTo("0.60");
    }
}
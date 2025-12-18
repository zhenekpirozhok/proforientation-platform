package com.diploma.proforientation.integration.ml;

import com.diploma.proforientation.config.MlClientConfig;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.service.scoring.ml.TraitScoreCalculator;
import com.diploma.proforientation.service.scoring.ml.impl.MlClientImpl;
import com.diploma.proforientation.service.scoring.ml.impl.MlResultMapper;
import com.diploma.proforientation.service.scoring.ml.impl.MlScoringEngineImpl;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Collections;
import java.util.List;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;

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
class MlScoringEngineIntegrationTest {

    @Autowired
    MlScoringEngineImpl scoringEngine;

    @MockitoBean
    ProfessionRepository professionRepository;
    @MockitoBean
    AnswerRepository answerRepository;
    @MockitoBean
    TraitScoreCalculator traitScoreCalculator;

    @Test
    void evaluateRaw_returnsRecommendationsFromMl() {
        stubFor(post("/predict")
                .willReturn(okJson("""
                    {
                      "top_5_predictions": [
                        { "major": "SE", "probability": 0.75 }
                      ]
                    }
                """)));

        Mockito.when(professionRepository.findIdByMlClassCode("SE"))
                .thenReturn(java.util.Optional.of(42));

        // 48 answers as required
        List<Integer> answers =
                java.util.Collections.nCopies(48, 3);

        ScoringResult result = scoringEngine.evaluateRaw(answers);

        List<RecommendationDto> recs = result.recommendations();

        assertThat(recs).hasSize(1);
        assertThat(recs.getFirst().professionId()).isEqualTo(42);
        assertThat(recs.getFirst().score()).isEqualTo("0.75");
    }

    @Test
    void evaluateRaw_invalidMlResponse_throwsException() {
        stubFor(post("/predict")
                .willReturn(okJson("""
                {
                  "unexpected_field": "oops"
                }
            """)));

        List<Integer> answers = Collections.nCopies(48, 3);

        assertThatThrownBy(() -> scoringEngine.evaluateRaw(answers))
                .isInstanceOf(RuntimeException.class);
    }
}
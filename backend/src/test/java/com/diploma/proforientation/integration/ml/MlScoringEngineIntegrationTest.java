package com.diploma.proforientation.integration.ml;

import com.diploma.proforientation.config.MlClientConfig;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.scoring.TraitScoreCalculator;
import com.diploma.proforientation.scoring.ml.impl.MlClientImpl;
import com.diploma.proforientation.scoring.ml.impl.MlProfessionExplanationServiceImpl;
import com.diploma.proforientation.scoring.ml.impl.MlResultMapper;
import com.diploma.proforientation.scoring.ml.impl.MlScoringEngineImpl;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cloud.contract.wiremock.AutoConfigureWireMock;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static com.github.tomakehurst.wiremock.client.WireMock.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.when;

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

    @MockitoBean
    MlProfessionExplanationServiceImpl explanationService;

    private Profession prof(int id, String code, String title, String desc) {
        Profession p = new Profession();
        p.setId(id);
        p.setCode(code);
        p.setTitleDefault(title);
        p.setDescription(desc);
        return p;
    }

    @Test
    void evaluateRaw_returnsRecommendationsFromMl_withLlmExplanation() {
        stubFor(post("/predict")
                .willReturn(okJson("""
                    {
                      "top_5_predictions": [
                        { "major": "SE", "probability": 0.75 }
                      ]
                    }
                """)));

        when(professionRepository.findIdByMlClassCode("SE"))
                .thenReturn(java.util.Optional.of(42));

        Profession p42 = prof(42, "se_prof", "Software Engineer", "Builds software");
        when(professionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(p42));

        when(explanationService.explainProfessions(List.of(p42)))
                .thenReturn(Map.of(42, "Software Engineers build and maintain applications."));

        List<Integer> answers = Collections.nCopies(48, 3);

        ScoringResult result = scoringEngine.evaluateRaw(answers);

        List<RecommendationDto> recs = result.recommendations();

        assertThat(recs).hasSize(1);
        assertThat(recs.getFirst().professionId()).isEqualTo(42);
        assertThat(recs.getFirst().score()).isEqualByComparingTo("0.75");
        assertThat(recs.getFirst().explanation())
                .isEqualTo("Software Engineers build and maintain applications.");
    }

    @Test
    void evaluateRaw_invalidAnswerCount_throwsException() {
        List<Integer> answers = Collections.nCopies(10, 3);

        assertThatThrownBy(() -> scoringEngine.evaluateRaw(answers))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("error.riasec.invalid_answer_count");
    }

    @Test
    void evaluateRaw_invalidMlResponse_returnsEmptyRecommendations() {
        stubFor(post("/predict")
                .willReturn(okJson("""
                { "unexpected_field": "oops" }
            """)));

        List<Integer> answers = Collections.nCopies(48, 3);

        ScoringResult result = scoringEngine.evaluateRaw(answers);

        assertThat(result).isNotNull();
        assertThat(result.recommendations()).isEmpty();
    }
}
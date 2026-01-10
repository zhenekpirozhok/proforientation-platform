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
import java.util.Map;

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
    void fullFlow_answersToRecommendations_withExplanations() {

        stubFor(post("/predict")
                .willReturn(okJson("""
                    {
                      "top_5_predictions": [
                        { "major": "SE", "probability": 0.80 },
                        { "major": "DS", "probability": 0.60 }
                      ]
                    }
                """)));

        Mockito.when(answerRepository.findValuesByAttemptId(1))
                .thenReturn(java.util.Collections.nCopies(48, 3));

        Mockito.when(professionRepository.findIdByMlClassCode("SE"))
                .thenReturn(java.util.Optional.of(10));

        Mockito.when(professionRepository.findIdByMlClassCode("DS"))
                .thenReturn(java.util.Optional.of(20));

        Profession p10 = prof(10, "se_prof", "Software Engineer", "Builds software systems");
        Profession p20 = prof(20, "ds_prof", "Data Scientist", "Analyzes data and builds models");

        Mockito.when(professionRepository.findAllById(Mockito.anyCollection()))
                .thenReturn(List.of(p10, p20));

        Mockito.when(traitScoreCalculator.calculateScores(1))
                .thenReturn(Map.of());

        Mockito.when(explanationService.explainProfessions(List.of(p10, p20)))
                .thenReturn(Map.of(
                        10, "Software Engineers design and build applications.",
                        20, "Data Scientists analyze data and build predictive models."
                ));

        ScoringResult result = scoringEngine.evaluate(1);

        List<RecommendationDto> recs = result.recommendations();

        assertThat(recs).hasSize(2);

        assertThat(recs.get(0).professionId()).isEqualTo(10);
        assertThat(recs.get(0).score()).isEqualByComparingTo("0.80");
        assertThat(recs.get(0).explanation()).isEqualTo("Software Engineers design and build applications.");

        assertThat(recs.get(1).professionId()).isEqualTo(20);
        assertThat(recs.get(1).score()).isEqualByComparingTo("0.60");
        assertThat(recs.get(1).explanation()).isEqualTo("Data Scientists analyze data and build predictive models.");

        Mockito.verify(answerRepository).findValuesByAttemptId(1);
        Mockito.verify(professionRepository).findIdByMlClassCode("SE");
        Mockito.verify(professionRepository).findIdByMlClassCode("DS");
        Mockito.verify(professionRepository).findAllById(Mockito.anyCollection());
        Mockito.verify(explanationService).explainProfessions(List.of(p10, p20));
        Mockito.verify(traitScoreCalculator).calculateScores(1);
    }
}
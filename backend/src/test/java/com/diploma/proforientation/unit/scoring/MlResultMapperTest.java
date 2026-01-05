package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.ml.MlPrediction;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.scoring.ml.impl.MlProfessionExplanationServiceImpl;
import com.diploma.proforientation.scoring.ml.impl.MlResultMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class MlResultMapperTest {

    private ProfessionRepository professionRepository;
    private MlProfessionExplanationServiceImpl explanationService;
    private MlResultMapper mapper;

    @BeforeEach
    void setup() {
        professionRepository = mock(ProfessionRepository.class);
        explanationService = mock(MlProfessionExplanationServiceImpl.class);
        mapper = new MlResultMapper(professionRepository, explanationService);
    }

    private Profession prof(int id, String code, String title, String desc) {
        Profession p = new Profession();
        p.setId(id);
        p.setCode(code);
        p.setTitleDefault(title);
        p.setDescription(desc);
        return p;
    }

    @Test
    void toRecommendations_mapsPredictions_andAddsLlmExplanations() {
        MlPrediction pred1 = new MlPrediction("ENG", BigDecimal.valueOf(0.9));
        MlPrediction pred2 = new MlPrediction("DEV", BigDecimal.valueOf(0.8));
        MlResultResponse response = new MlResultResponse("R", List.of(pred1, pred2));

        when(professionRepository.findIdByMlClassCode("ENG")).thenReturn(Optional.of(10));
        when(professionRepository.findIdByMlClassCode("DEV")).thenReturn(Optional.of(20));

        Profession p10 = prof(10, "eng", "Engineer", "Engineering work");
        Profession p20 = prof(20, "dev", "Developer", "Writes code");

        when(professionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(p10, p20));

        when(explanationService.explainProfessions(List.of(p10, p20)))
                .thenReturn(Map.of(
                        10, "Engineer explanation",
                        20, "Developer explanation"
                ));

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).hasSize(2);

        assertThat(recs.getFirst().professionId()).isEqualTo(10);
        assertThat(recs.get(0).score()).isEqualTo(BigDecimal.valueOf(0.9));
        assertThat(recs.get(0).explanation()).isEqualTo("Engineer explanation");

        assertThat(recs.get(1).professionId()).isEqualTo(20);
        assertThat(recs.get(1).score()).isEqualTo(BigDecimal.valueOf(0.8));
        assertThat(recs.get(1).explanation()).isEqualTo("Developer explanation");

        verify(professionRepository).findIdByMlClassCode("ENG");
        verify(professionRepository).findIdByMlClassCode("DEV");
        verify(professionRepository).findAllById(anyCollection());
        verify(explanationService).explainProfessions(List.of(p10, p20));
    }

    @Test
    void toRecommendations_whenSomeMlClassNotMapped_skipsThosePredictions() {
        MlPrediction pred1 = new MlPrediction("ENG", BigDecimal.valueOf(0.9));
        MlPrediction pred2 = new MlPrediction("UNKNOWN", BigDecimal.valueOf(0.7));
        MlResultResponse response = new MlResultResponse("R", List.of(pred1, pred2));

        when(professionRepository.findIdByMlClassCode("ENG")).thenReturn(Optional.of(10));
        when(professionRepository.findIdByMlClassCode("UNKNOWN")).thenReturn(Optional.empty());

        Profession p10 = prof(10, "eng", "Engineer", "Engineering work");

        when(professionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(p10));

        when(explanationService.explainProfessions(List.of(p10)))
                .thenReturn(Map.of(10, "Engineer explanation"));

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).hasSize(1);
        assertThat(recs.getFirst().professionId()).isEqualTo(10);
        assertThat(recs.getFirst().score()).isEqualTo(BigDecimal.valueOf(0.9));
        assertThat(recs.getFirst().explanation()).isEqualTo("Engineer explanation");

        verify(professionRepository).findIdByMlClassCode("ENG");
        verify(professionRepository).findIdByMlClassCode("UNKNOWN");
        verify(professionRepository).findAllById(anyCollection());
        verify(explanationService).explainProfessions(List.of(p10));
    }

    @Test
    void toRecommendations_whenExplanationMissing_usesFallbackText() {
        MlPrediction pred1 = new MlPrediction("ENG", BigDecimal.valueOf(0.9));
        MlResultResponse response = new MlResultResponse("R", List.of(pred1));

        when(professionRepository.findIdByMlClassCode("ENG")).thenReturn(Optional.of(10));

        Profession p10 = prof(10, "eng", "Engineer", "Engineering work");

        when(professionRepository.findAllById(anyCollection()))
                .thenReturn(List.of(p10));

        // explanation service returns empty => fallback should be used
        when(explanationService.explainProfessions(List.of(p10)))
                .thenReturn(Map.of());

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).hasSize(1);
        assertThat(recs.getFirst().professionId()).isEqualTo(10);
        assertThat(recs.getFirst().score()).isEqualTo(BigDecimal.valueOf(0.9));
        assertThat(recs.getFirst().explanation())
                .isEqualTo("Recommended based on machine learning prediction.");
    }

    @Test
    void toRecommendations_emptyPredictions_returnsEmptyList() {
        MlResultResponse response = new MlResultResponse("R", List.of());

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).isEmpty();
        verifyNoInteractions(professionRepository, explanationService);
    }

    @Test
    void toRecommendations_nullResponse_returnsEmptyList() {
        List<RecommendationDto> recs = mapper.toRecommendations(null);

        assertThat(recs).isEmpty();
        verifyNoInteractions(professionRepository, explanationService);
    }
}
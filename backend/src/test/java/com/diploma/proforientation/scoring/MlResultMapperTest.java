package com.diploma.proforientation.scoring;

import com.diploma.proforientation.dto.MlPrediction;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.service.scoring.ml.impl.MlResultMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class MlResultMapperTest {

    private ProfessionRepository professionRepository;
    private MlResultMapper mapper;

    @BeforeEach
    void setup() {
        professionRepository = mock(ProfessionRepository.class);
        mapper = new MlResultMapper(professionRepository);
    }

    @Test
    void toRecommendations_mapsPredictions_correctly() {
        MlPrediction pred1 = new MlPrediction("ENG", BigDecimal.valueOf(0.9));
        MlPrediction pred2 = new MlPrediction("DEV", BigDecimal.valueOf(0.8));

        MlResultResponse response = new MlResultResponse("R", List.of(pred1, pred2));

        when(professionRepository.findIdByMlClassCode("ENG")).thenReturn(Optional.of(10));
        when(professionRepository.findIdByMlClassCode("DEV")).thenReturn(Optional.of(20));

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).hasSize(2);
        assertThat(recs.getFirst().professionId()).isEqualTo(10);
        assertThat(recs.get(0).score()).isEqualTo(BigDecimal.valueOf(0.9));
        assertThat(recs.get(0).explanation()).isEqualTo("Predicted as: ENG");

        assertThat(recs.get(1).professionId()).isEqualTo(20);
        assertThat(recs.get(1).score()).isEqualTo(BigDecimal.valueOf(0.8));
        assertThat(recs.get(1).explanation()).isEqualTo("Predicted as: DEV");
    }

    @Test
    void toRecommendations_professionNotFound_setsNull() {
        MlPrediction pred = new MlPrediction("UNKNOWN", BigDecimal.valueOf(0.7));
        MlResultResponse response = new MlResultResponse("R", List.of(pred));

        when(professionRepository.findIdByMlClassCode("UNKNOWN")).thenReturn(Optional.empty());

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).hasSize(1);
        assertThat(recs.getFirst().professionId()).isNull();
        assertThat(recs.getFirst().score()).isEqualTo(BigDecimal.valueOf(0.7));
        assertThat(recs.getFirst().explanation()).isEqualTo("Predicted as: UNKNOWN");
    }

    @Test
    void toRecommendations_emptyPredictions_returnsEmptyList() {
        MlResultResponse response = new MlResultResponse("R", List.of());

        List<RecommendationDto> recs = mapper.toRecommendations(response);

        assertThat(recs).isEmpty();
        verifyNoInteractions(professionRepository);
    }
}
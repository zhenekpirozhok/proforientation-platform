package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.service.scoring.ml.impl.MlClientImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MlClientImplTest {

    private MlClientImpl service;

    @BeforeEach
    void setup() {
        service = new MlClientImpl(null) {
            @Override
            public MlResultResponse predict(List<BigDecimal> features) {
                return new MlResultResponse(
                        "R",
                        List.of()
                );
            }
        };
    }

    @Test
    void predict_simulatedResponse() {
        List<BigDecimal> features = List.of(BigDecimal.ONE, BigDecimal.TEN);

        MlResultResponse result = service.predict(features);

        assertThat(result.predicted_major()).contains("R");
        assertThat(result.top_5_predictions()).isEmpty();
    }
}
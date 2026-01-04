package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.scoring.ml.impl.MlClientImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MlClientTest {

    @Mock
    RestClient restClient;

    @Mock
    RestClient.RequestBodyUriSpec uriSpec;

    @Mock
    RestClient.RequestBodySpec bodySpec;

    @Mock
    RestClient.ResponseSpec responseSpec;

    MlClientImpl client;

    @BeforeEach
    void setup() {
        client = new MlClientImpl(restClient);

        when(restClient.post()).thenReturn(uriSpec);
        when(uriSpec.uri("/predict")).thenReturn(bodySpec);
        when(bodySpec.contentType(any())).thenReturn(bodySpec);

        when(bodySpec.body(ArgumentMatchers.<Object>any()))
                .thenReturn(bodySpec);

        when(bodySpec.retrieve()).thenReturn(responseSpec);
    }

    @Test
    void predict_returnsResponse() {
        MlResultResponse response =
                new MlResultResponse("R", List.of());

        when(responseSpec.body(MlResultResponse.class))
                .thenReturn(response);

        MlResultResponse result =
                client.predict(List.of(BigDecimal.ONE));

        assertThat(result.predicted_major()).contains("R");
    }
}
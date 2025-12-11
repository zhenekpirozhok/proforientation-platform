package com.diploma.proforientation.service.scoring.ml.impl;

import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.service.scoring.ml.MlClient;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class MlClientImpl implements MlClient {

    private final RestClient client;

    @Override
    public MlResultResponse predict(List<BigDecimal> features) {

        Map<String, Object> body = new HashMap<>();
        body.put("features", features);

        return client.post()
                .uri("/predict")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(MlResultResponse.class);
    }
}
package com.diploma.proforientation.service.scoring.ml.impl;

import com.diploma.proforientation.dto.response.MlResultResponse;
import com.diploma.proforientation.service.scoring.ml.MlClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class MlClientImpl implements MlClient {
    private static final String FEATURES_KEY = "features";
    private static final String PREDICT_ENDPOINT = "/predict";

    private final RestClient client;

    @Override
    public MlResultResponse predict(List<BigDecimal> features) {

        Map<String, Object> body = new HashMap<>();
        body.put(FEATURES_KEY, features);
        log.info("ML request worked");

        return client.post()
                .uri(PREDICT_ENDPOINT)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(MlResultResponse.class);
    }
}
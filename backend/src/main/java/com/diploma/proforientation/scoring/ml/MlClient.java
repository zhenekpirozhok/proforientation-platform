package com.diploma.proforientation.scoring.ml;

import com.diploma.proforientation.dto.response.MlResultResponse;

import java.math.BigDecimal;
import java.util.List;

public interface MlClient {
    MlResultResponse predict(List<BigDecimal> features);
}
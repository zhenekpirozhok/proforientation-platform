package com.diploma.proforientation.dto.response;

import com.diploma.proforientation.dto.MlPrediction;

import java.util.List;

public record MlResultResponse(
        String predicted_major,
        List<MlPrediction> top_5_predictions
) {}
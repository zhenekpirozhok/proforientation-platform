package com.diploma.proforientation.scoring.demo;

import com.diploma.proforientation.dto.ml.MlPrediction;

import java.util.List;

public record DemoResponse(
        String predictedMajor,
        List<MlPrediction> top5,
        String llmSummary
) {}

package com.diploma.proforientation.service.scoring.demo;

import com.diploma.proforientation.dto.MlPrediction;

import java.util.List;

public record DemoResponse(
        String predictedMajor,
        List<MlPrediction> top5,
        String llmSummary
) {}

package com.diploma.proforientation.dto.response;

import com.diploma.proforientation.dto.ml.MlPrediction;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Raw prediction result returned by the ML service")
public record MlResultResponse(
        @Schema(
                description = "Primary predicted major produced by the ML model",
                example = "Software Engineer"
        )
        String predicted_major,
        @Schema(
                description = """
                        Top 5 predicted majors with associated probabilities,
                        sorted in descending order by probability.
                        """,
                example = """
                        [
                          { "major": "SE", "probability": 0.82 },
                          { "major": "DS", "probability": 0.75 },
                          { "major": "AI", "probability": 0.69 }
                        ]
                        """
        )
        List<MlPrediction> top_5_predictions
) {}
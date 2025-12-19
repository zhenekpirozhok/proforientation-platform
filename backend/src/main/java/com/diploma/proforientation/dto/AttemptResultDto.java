package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

@Schema(description = "Detailed result of a completed quiz attempt")
public record AttemptResultDto(
        @Schema(
                description = """
                        Calculated trait scores.
                        The key represents the trait code, the value represents the score.
                        """,
                examples = """
                        {
                          "R": 12.5,
                          "I": 9.0,
                          "A": 7.5
                        }
                        """
        )
        List<TraitScoreDto> traitScores,
        @Schema(
                description = "List of recommended professions based on ML prediction",
                examples = """
                        [
                          {
                            "professionId": 42,
                            "score": 0.82,
                            "explanation": "Predicted as: Software Engineer"
                          }
                        ]
                        """
        )
        List<RecommendationDto> recommendations
) {}
package com.diploma.proforientation.scoring.demo;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

public record DemoRequest(
        @Schema(
                description = "List of selected answer IDs",
                examples = """
                        {
                          "answers": [
                            3,3,3,3,3,3,3,3,
                            3,3,3,3,3,3,3,3,
                            3,3,3,3,3,3,3,3,
                            3,3,3,3,3,3,3,3,
                            3,3,3,3,3,3,3,3,
                            3,3,3,3,3,3,3,3
                          ]
                        }"""
        )
        List<Integer> answers
) {}
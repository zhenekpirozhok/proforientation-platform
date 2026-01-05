package com.diploma.proforientation.dto.request.add;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

@Schema(description = "Submit selected optionIds for a single question (overwrites previous answers for that question)")
public record AddAnswersForQuestionRequest(
        @NotNull
        @Schema(description = "Question id", example = "10")
        Integer questionId,

        @NotEmpty
        @Schema(description = "Selected option ids for this question", example = "[100,101]")
        List<Integer> optionIds
) {}
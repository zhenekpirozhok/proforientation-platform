package com.diploma.proforientation.dto.request;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AddAnswersBulkRequest(
        @NotEmpty List<Integer> optionIds
) {}

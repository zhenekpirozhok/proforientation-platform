package com.diploma.proforientation.dto.request.add;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

@Schema(description = "Request payload for submitting multiple answers in a single operation")
public record AddAnswersBulkRequest(
        @Schema(
                description = "List of selected option IDs",
                examples = """
                        [
                                                    1,6,11,16,21,26,31,36,
                                                    41,46,51,56,61,66,71,76,
                                                    81,86,91,96,101,106,111,116,
                                                    121,126,131,136,141,146,151,156,
                                                    161,166,171,176,181,186,191,196,
                                                    201,206,211,216,221,226,231,236
                                                  ]""",
                requiredMode = Schema.RequiredMode.REQUIRED
        )
        @NotEmpty List<Integer> optionIds
) {}

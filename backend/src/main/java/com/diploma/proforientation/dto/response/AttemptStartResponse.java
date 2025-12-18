package com.diploma.proforientation.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Response returned when a quiz attempt is started")
public record AttemptStartResponse(
        @Schema(
                description = "Unique identifier of the created attempt",
                example = "123"
        )
        Integer attemptId,
        @Schema(
                description = """
                        Guest access token used to continue the attempt without authentication.
                        Null for authenticated users.
                        """,
                example = "f7c1a2e9-8a9d-4b2e-9b61-1a2f8c123abc",
                nullable = true
        )
        String guestToken   // nullable for authenticated users
) {}
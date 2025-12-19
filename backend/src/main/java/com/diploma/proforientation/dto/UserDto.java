package com.diploma.proforientation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Authenticated user info")
public record UserDto(
        @Schema(
                description = "Unique identifier of the user",
                examples = "12"
        )
        Integer id,
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        @Schema(
                description = "User email address",
                examples = "user@example.com",
                format = "email"
        )
        String email,
        @Schema(
                description = "Display name shown in the UI",
                examples = "John Doe"
        )
        String displayName,
        @Schema(
                description = "Role assigned to the user",
                examples = "USER",
                allowableValues = {"USER", "ADMIN"}
        )
        String role
) {}
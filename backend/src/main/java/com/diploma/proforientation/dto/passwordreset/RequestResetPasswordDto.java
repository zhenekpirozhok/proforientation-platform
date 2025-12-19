package com.diploma.proforientation.dto.passwordreset;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Data Transfer Object for requesting a password reset.
 * <p>
 * This DTO is used when a user submits a request to reset their password.
 * It captures and validates the email address to ensure it is present and properly formatted.
 * </p>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Request payload for initiating a password reset process")
public class RequestResetPasswordDto {

    /**
     * The email address associated with the user's account.
     * <p>
     * Must not be blank and must be a valid email format.
     * </p>
     */
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    @Schema(
            description = "Email address associated with the user account",
            examples = "user@example.com",
            requiredMode = Schema.RequiredMode.REQUIRED
    )
    private String email;
}

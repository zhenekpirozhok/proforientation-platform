package com.diploma.proforientation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Entity representing a password reset token.
 *
 * <p>This token is associated with a user's email and has an expiration date to
 * allow secure password reset functionality.</p>
 */
@Entity
@Table(name = "password_reset")
@Getter
@Setter
public class PasswordResetToken {

    /**
     * Unique identifier for the token.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    /**
     * The unique token string used to verify the password reset request.
     */
    @Column(nullable = false, unique = true)
    private String token;

    /**
     * The id of the user who requested the password reset.
     */
    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    /**
     * The date and time at which this token expires.
     */
    @Column(nullable = false)
    private LocalDateTime expiryDate;
}
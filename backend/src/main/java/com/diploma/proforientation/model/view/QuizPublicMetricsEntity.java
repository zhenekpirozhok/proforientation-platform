package com.diploma.proforientation.model.view;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.Immutable;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Immutable
@Table(name = "v_quiz_public_metrics")
public class QuizPublicMetricsEntity {

    @Id
    @Column(name = "quiz_id")
    private Integer quizId;

    @Column(name = "quiz_code")
    private String quizCode;

    @Column(name = "quiz_status")
    private String quizStatus;

    @Column(name = "category_id")
    private Integer categoryId;

    @Column(name = "questions_total")
    private Integer questionsTotal;

    @Column(name = "attempts_total")
    private Integer attemptsTotal;

    @Column(name = "attempts_submitted")
    private Integer attemptsSubmitted;

    @Column(name = "avg_duration_seconds")
    private BigDecimal avgDurationSeconds;

    @Column(name = "estimated_duration_seconds")
    private Integer estimatedDurationSeconds;
}
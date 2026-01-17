package com.diploma.proforientation.model.view;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.io.Serializable;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Immutable
@Table(name = "v_quiz_question_discrimination_norm_all")
public class QuizQuestionDiscriminationEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "min_ord")
    private BigDecimal minOrd;

    @Column(name = "max_ord")
    private BigDecimal maxOrd;

    @Column(name = "attempts_submitted")
    private Integer attemptsSubmitted;

    @Column(name = "answers_top")
    private Integer answersTop;

    @Column(name = "answers_bottom")
    private Integer answersBottom;

    @Column(name = "top_avg_ord")
    private BigDecimal topAvgOrd;

    @Column(name = "bottom_avg_ord")
    private BigDecimal bottomAvgOrd;

    @Column(name = "disc_raw")
    private BigDecimal discRaw;

    @Column(name = "disc_norm")
    private BigDecimal discNorm;

    @Column(name = "disc_quality")
    private String discQuality;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "quiz_id")
        private Integer quizId;

        @Column(name = "quiz_version_id")
        private Integer quizVersionId;

        @Column(name = "question_id")
        private Integer questionId;
    }
}
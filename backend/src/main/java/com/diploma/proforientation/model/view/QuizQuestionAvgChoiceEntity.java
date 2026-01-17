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
@Table(name = "v_quiz_question_avg_choice")
public class QuizQuestionAvgChoiceEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "question_ord")
    private Integer questionOrd;

    @Column(name = "avg_choice")
    private BigDecimal avgChoice;

    @Column(name = "answers_count")
    private Integer answersCount;

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
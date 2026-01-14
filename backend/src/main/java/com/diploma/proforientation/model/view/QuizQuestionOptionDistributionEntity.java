package com.diploma.proforientation.model.view;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Immutable
@Table(name = "v_quiz_question_option_distribution")
public class QuizQuestionOptionDistributionEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "question_ord")
    private Integer questionOrd;

    @Column(name = "option_ord")
    private Integer optionOrd;

    @Column(name = "cnt")
    private Integer count;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "quiz_id")
        private Integer quizId;

        @Column(name = "quiz_version_id")
        private Integer quizVersionId;

        @Column(name = "question_id")
        private Integer questionId;

        @Column(name = "option_id")
        private Integer optionId;
    }
}
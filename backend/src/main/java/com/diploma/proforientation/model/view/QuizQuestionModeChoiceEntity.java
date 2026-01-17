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
@Table(name = "v_quiz_question_mode_choice")
public class QuizQuestionModeChoiceEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "question_ord")
    private Integer questionOrd;

    @Column(name = "mode_choice")
    private Integer modeChoice;

    @Column(name = "mode_count")
    private Integer modeCount;

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

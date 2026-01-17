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
@Table(name = "v_quiz_top_professions")
public class QuizTopProfessionEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "profession_title")
    private String professionTitle;

    @Column(name = "top1_count")
    private Integer top1Count;

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

        @Column(name = "profession_id")
        private Integer professionId;
    }
}
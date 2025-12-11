package com.diploma.proforientation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.util.Objects;

@Getter
@Setter
@Entity
@Table(name = "quiz_professions")
@IdClass(QuizProfession.QuizProfessionId.class)
public class QuizProfession {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profession_id", nullable = false)
    private Profession profession;

    public static class QuizProfessionId implements Serializable {

        private Integer quiz;
        private Integer profession;

        public QuizProfessionId() {}

        public QuizProfessionId(Integer quiz, Integer profession) {
            this.quiz = quiz;
            this.profession = profession;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof QuizProfessionId that)) return false;
            return Objects.equals(quiz, that.quiz) &&
                    Objects.equals(profession, that.profession);
        }

        @Override
        public int hashCode() {
            return Objects.hash(quiz, profession);
        }
    }
}
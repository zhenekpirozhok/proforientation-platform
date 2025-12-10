package com.diploma.proforientation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Objects;

@Getter
@Setter
@Entity
@Table(name = "question_option_traits")
@IdClass(QuestionOptionTrait.QuestionOptionTraitId.class)
public class QuestionOptionTrait {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_option_id", nullable = false)
    private QuestionOption option;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trait_id", nullable = false)
    private TraitProfile trait;

    private BigDecimal weight = BigDecimal.valueOf(1.0);

    public static class QuestionOptionTraitId implements Serializable {

        private Integer option;
        private Integer trait;

        public QuestionOptionTraitId() {}

        public QuestionOptionTraitId(Integer option, Integer trait) {
            this.option = option;
            this.trait = trait;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof QuestionOptionTraitId that)) return false;
            return Objects.equals(option, that.option) &&
                    Objects.equals(trait, that.trait);
        }

        @Override
        public int hashCode() {
            return Objects.hash(option, trait);
        }
    }
}
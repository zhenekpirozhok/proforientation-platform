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
@Table(name = "attempt_trait_scores")
@IdClass(AttemptTraitScore.AttemptTraitScoreId.class)
public class AttemptTraitScore {

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private Attempt attempt;

    @Id
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "trait_id", nullable = false)
    private TraitProfile trait;

    @Column(nullable = false)
    private BigDecimal score;

    public static class AttemptTraitScoreId implements Serializable {

        private Integer attempt;
        private Integer trait;

        public AttemptTraitScoreId() {}

        public AttemptTraitScoreId(Integer attempt, Integer trait) {
            this.attempt = attempt;
            this.trait = trait;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof AttemptTraitScoreId)) return false;
            AttemptTraitScoreId that = (AttemptTraitScoreId) o;
            return Objects.equals(attempt, that.attempt)
                    && Objects.equals(trait, that.trait);
        }

        @Override
        public int hashCode() {
            return Objects.hash(attempt, trait);
        }
    }
}
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
@Table(name = "v_quiz_funnel_overview")
public class QuizFunnelOverviewEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "attempts_started")
    private Integer attemptsStarted;

    @Column(name = "attempts_completed")
    private Integer attemptsCompleted;

    @Column(name = "completion_rate")
    private BigDecimal completionRate;

    @Column(name = "avg_duration_seconds")
    private BigDecimal avgDurationSeconds;

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
    }
}
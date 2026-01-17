package com.diploma.proforientation.model.view;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Immutable;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Immutable
@Table(name = "v_quiz_activity_daily")
public class QuizActivityDailyEntity {

    @EmbeddedId
    private Id id;

    @Column(name = "attempts_started")
    private Integer attemptsStarted;

    @Column(name = "attempts_completed")
    private Integer attemptsCompleted;

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

        @Column(name = "day")
        private LocalDate day;
    }
}
package com.diploma.proforientation.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "quiz_versions",
        uniqueConstraints = @UniqueConstraint(columnNames = {"quiz_id", "version"}))
public class QuizVersion {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    private Integer version;

    @Column(name = "is_current")
    private boolean current = false;

    @Column(name = "published_at")
    private Instant publishedAt;
}

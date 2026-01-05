package com.diploma.proforientation.model;

import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.model.enumeration.QuizStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;

@Getter
@Setter
@Entity
@Table(name = "quizzes")
public class Quiz {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(unique = true, nullable = false)
    private String code;

    @Column(name = "title_default", nullable = false)
    private String titleDefault;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private QuizStatus status = QuizStatus.DRAFT;

    @Column(name = "processing_mode")
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private QuizProcessingMode processingMode = QuizProcessingMode.LLM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private ProfessionCategory category;

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(name = "description_default", length = 1000)
    private String descriptionDefault;

    @Column(name = "seconds_per_question_default")
    private int secondsPerQuestionDefault = 30;
}

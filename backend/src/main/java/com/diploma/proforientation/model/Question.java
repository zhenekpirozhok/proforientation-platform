package com.diploma.proforientation.model;

import com.diploma.proforientation.model.enumeration.QuestionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "questions")
public class Question {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_version_id", nullable = false)
    private QuizVersion quizVersion;

    private Integer ord;

    @Enumerated(EnumType.STRING)
    private QuestionType qtype = QuestionType.single_choice;

    @Column(name = "text_default", nullable = false)
    private String textDefault;
}

package com.diploma.proforientation.repository.view;

import com.diploma.proforientation.model.view.QuizQuestionDiscriminationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionDiscriminationRepository
        extends JpaRepository<QuizQuestionDiscriminationEntity, QuizQuestionDiscriminationEntity.Id> {

    List<QuizQuestionDiscriminationEntity> findByIdQuizIdAndIdQuizVersionId(
            Integer quizId, Integer quizVersionId
    );
}
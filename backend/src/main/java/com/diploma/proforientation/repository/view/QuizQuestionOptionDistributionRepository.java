package com.diploma.proforientation.repository.view;

import com.diploma.proforientation.model.view.QuizQuestionOptionDistributionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionOptionDistributionRepository
        extends JpaRepository<QuizQuestionOptionDistributionEntity, QuizQuestionOptionDistributionEntity.Id> {

    List<QuizQuestionOptionDistributionEntity> findByIdQuizIdAndIdQuizVersionId(
            Integer quizId, Integer quizVersionId
    );
}
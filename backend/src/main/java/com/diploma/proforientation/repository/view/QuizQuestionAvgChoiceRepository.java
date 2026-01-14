package com.diploma.proforientation.repository.view;

import com.diploma.proforientation.model.view.QuizQuestionAvgChoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionAvgChoiceRepository
        extends JpaRepository<QuizQuestionAvgChoiceEntity, QuizQuestionAvgChoiceEntity.Id> {

    List<QuizQuestionAvgChoiceEntity> findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(
            Integer quizId, Integer quizVersionId
    );
}
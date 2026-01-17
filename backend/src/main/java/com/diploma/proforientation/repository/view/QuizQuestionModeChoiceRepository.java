package com.diploma.proforientation.repository.view;

import com.diploma.proforientation.model.view.QuizQuestionModeChoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizQuestionModeChoiceRepository
        extends JpaRepository<QuizQuestionModeChoiceEntity, QuizQuestionModeChoiceEntity.Id> {

    List<QuizQuestionModeChoiceEntity> findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(
            Integer quizId, Integer quizVersionId
    );
}
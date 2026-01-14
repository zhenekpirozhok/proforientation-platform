package com.diploma.proforientation.repository.view;


import com.diploma.proforientation.model.view.QuizActivityDailyEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface QuizActivityDailyRepository
        extends JpaRepository<QuizActivityDailyEntity, QuizActivityDailyEntity.Id> {

    List<QuizActivityDailyEntity> findByIdQuizIdAndIdQuizVersionIdAndIdDayBetween(
            Integer quizId, Integer quizVersionId, LocalDate from, LocalDate to
    );
    List<QuizActivityDailyEntity> findByIdQuizIdAndIdQuizVersionIdOrderByIdDayAsc(Integer quizId, Integer quizVersionId);
    List<QuizActivityDailyEntity> findByIdQuizIdAndIdQuizVersionId(Integer quizId, Integer quizVersionId);
}
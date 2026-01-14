package com.diploma.proforientation.repository.view;

import com.diploma.proforientation.model.view.QuizFunnelOverviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizFunnelOverviewRepository
        extends JpaRepository<QuizFunnelOverviewEntity, QuizFunnelOverviewEntity.Id> {

    List<QuizFunnelOverviewEntity> findByIdQuizId(Integer quizId);
    QuizFunnelOverviewEntity findByIdQuizIdAndIdQuizVersionId(Integer quizId, Integer quizVersionId);
}
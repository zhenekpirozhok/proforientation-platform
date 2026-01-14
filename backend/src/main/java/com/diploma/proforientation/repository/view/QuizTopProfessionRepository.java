package com.diploma.proforientation.repository.view;

import com.diploma.proforientation.model.view.QuizTopProfessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizTopProfessionRepository
        extends JpaRepository<QuizTopProfessionEntity, QuizTopProfessionEntity.Id> {

    List<QuizTopProfessionEntity> findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(
            Integer quizId,
            Integer quizVersionId
    );
}
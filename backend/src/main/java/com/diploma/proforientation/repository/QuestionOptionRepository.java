package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Integer> {
    List<QuestionOption> findByQuestionId(Integer questionId);
    List<QuestionOption> findByQuestionIdOrderByOrd(Integer questionId);
    List<QuestionOption> findByQuestionIdOrderByOrdAsc(Integer questionId);
}

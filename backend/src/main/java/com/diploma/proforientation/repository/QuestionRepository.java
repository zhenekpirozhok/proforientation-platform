package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Integer> {
    List<Question> findByQuizVersionId(Integer quizVersionId);
    List<Question> findByQuizVersionIdOrderByOrd(Integer quizVersionId);
}

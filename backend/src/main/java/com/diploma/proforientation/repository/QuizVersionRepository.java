package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuizVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizVersionRepository extends JpaRepository<QuizVersion, Integer> {
    Optional<QuizVersion> findTopByQuizIdOrderByVersionDesc(Integer quizId);
}

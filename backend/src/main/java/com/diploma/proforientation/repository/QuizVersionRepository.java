package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuizVersion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface QuizVersionRepository extends JpaRepository<QuizVersion, Integer> {
    Optional<QuizVersion> findTopByQuizIdOrderByVersionDesc(Integer quizId);
    Optional<QuizVersion> findByQuizIdAndCurrentTrue(Integer quizId);
    Optional<QuizVersion> findByQuizIdAndVersion(Integer quizId, Integer version);
    List<QuizVersion> findByQuizIdOrderByVersionDesc(Integer quizId);
}

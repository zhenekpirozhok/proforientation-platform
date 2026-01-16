package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.QuizVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface QuizVersionRepository extends JpaRepository<QuizVersion, Integer> {
    Optional<QuizVersion> findTopByQuizIdOrderByVersionDesc(Integer quizId);
    Optional<QuizVersion> findByQuizIdAndCurrentTrue(Integer quizId);
    Optional<QuizVersion> findByQuizIdAndVersion(Integer quizId, Integer version);
    List<QuizVersion> findByQuizIdOrderByVersionDesc(Integer quizId);
    @Modifying
    @Query("UPDATE QuizVersion v SET v.current = false WHERE v.quiz.id = :quizId")
    void clearCurrentForQuiz(@Param("quizId") Integer quizId);
}

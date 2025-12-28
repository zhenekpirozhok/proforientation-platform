package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Quiz;
import com.diploma.proforientation.model.view.QuizPublicMetricsView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizPublicMetricsRepository
        extends JpaRepository<Quiz, Integer> {

    @Query(
            value = "SELECT * FROM v_quiz_public_metrics",
            nativeQuery = true
    )
    List<QuizPublicMetricsView> findAllMetrics();

    @Query(
            value = "SELECT * FROM v_quiz_public_metrics WHERE quiz_id = :quizId",
            nativeQuery = true
    )
    Optional<QuizPublicMetricsView> findByQuizId(Integer quizId);
}
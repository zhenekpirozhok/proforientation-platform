package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.view.QuizPublicMetricsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface QuizPublicMetricsRepository extends JpaRepository<QuizPublicMetricsEntity, Integer>,
        JpaSpecificationExecutor<QuizPublicMetricsEntity> {

    @Query("""
        select m.quizId
        from QuizPublicMetricsEntity m
        where (:minDur is null or m.estimatedDurationSeconds >= :minDur)
          and (:maxDur is null or m.estimatedDurationSeconds <= :maxDur)
    """)
    List<Integer> findQuizIdsByDuration(Integer minDur, Integer maxDur);
    List<QuizPublicMetricsEntity> findAll();
    Optional<QuizPublicMetricsEntity> findById(Integer quizId);
}

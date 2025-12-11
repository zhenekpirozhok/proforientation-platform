package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.AttemptRecommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AttemptRecommendationRepository extends JpaRepository<AttemptRecommendation, Integer> {
    void deleteByAttempt_Id(Integer attemptId);
    @Query("SELECT r FROM AttemptRecommendation r WHERE r.attempt.id = :attemptId")
    List<AttemptRecommendation> findByAttemptId(Integer attemptId);
}

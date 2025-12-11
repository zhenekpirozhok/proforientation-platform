package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.AttemptTraitScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AttemptTraitScoreRepository extends JpaRepository<AttemptTraitScore, AttemptTraitScore.AttemptTraitScoreId> {
    void deleteByAttempt_Id(Integer attemptId);
    @Query("SELECT t FROM AttemptTraitScore t WHERE t.attempt.id = :attemptId")
    List<AttemptTraitScore> findByAttemptId(Integer attemptId);
}

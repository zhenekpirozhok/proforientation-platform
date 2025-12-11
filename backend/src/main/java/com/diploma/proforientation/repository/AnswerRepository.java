package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Integer> {
    List<Answer> findByAttemptId(Integer attemptId);
    long countByAttemptId(Integer attemptId);
    void deleteByAttemptId(Integer attemptId);
    @Query("""
    SELECT qo.ord
    FROM Answer a
    JOIN a.option qo
    WHERE a.attempt.id = :attemptId
    ORDER BY qo.question.ord
    """)
    List<Integer> findValuesByAttemptId(Integer attemptId);
}

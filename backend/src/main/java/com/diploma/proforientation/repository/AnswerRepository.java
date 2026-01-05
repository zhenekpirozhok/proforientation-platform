package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Answer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AnswerRepository extends JpaRepository<Answer, Integer> {
    List<Answer> findByAttemptId(Integer attemptId);
    void deleteByAttemptId(Integer attemptId);
    long countByAttemptId(Integer attemptId);
    @Query("""
    SELECT qo.ord
    FROM Answer a
    JOIN a.option qo
    WHERE a.attempt.id = :attemptId
    ORDER BY qo.question.ord
    """)
    List<Integer> findValuesByAttemptId(Integer attemptId);
    @Modifying
    @Query("""
        delete from Answer a
        where a.attempt.id = :attemptId
          and a.option.question.id = :questionId
    """)
    void deleteByAttemptIdAndQuestionId(
            @Param("attemptId") Integer attemptId,
            @Param("questionId") Integer questionId
    );
}

package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Attempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;

public interface AttemptRepository extends JpaRepository<Attempt, Integer> {
    List<Attempt> findByUserIdAndDeletedAtIsNullOrderByStartedAtDesc(Integer userId);
    List<Attempt> findByGuestTokenAndDeletedAtIsNullOrderByStartedAtDesc(String token);
    List<Attempt> findAllByGuestTokenAndDeletedAtIsNull(String guestToken);
    @Query("""
    SELECT a FROM Attempt a
    WHERE (:userId IS NULL OR a.user.id = :userId)
      AND (:quizId IS NULL OR a.quizVersion.quiz.id = :quizId)
      AND (:from IS NULL OR a.startedAt >= :from)
      AND (:to IS NULL OR a.startedAt <= :to)
    ORDER BY a.startedAt DESC
""")
    List<Attempt> searchAdmin(
            @Param("userId") Integer userId,
            @Param("quizId") Integer quizId,
            @Param("from") Instant from,
            @Param("to") Instant to
    );
}

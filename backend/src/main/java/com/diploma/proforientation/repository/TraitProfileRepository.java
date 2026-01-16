package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.TraitProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TraitProfileRepository extends JpaRepository<TraitProfile, Integer> {
    @Query("""
    SELECT DISTINCT t
    FROM TraitProfile t
    JOIN QuestionOptionTrait qot ON qot.trait.id = t.id
    JOIN QuestionOption qo ON qo.id = qot.option.id
    JOIN Question q ON q.id = qo.question.id
    WHERE q.quizVersion.id = :quizVersionId
    ORDER BY t.id
""")
    List<TraitProfile> findTraitsForQuizVersion(@Param("quizVersionId") Integer quizId);
}
package com.diploma.proforientation.scoring.ml.impl;

import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.scoring.ml.TraitScoreCalculator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class TraitScoreCalculatorImpl implements TraitScoreCalculator {
    private static final String ATTEMPT_ID_KEY = "attemptId";


    @PersistenceContext
    private final EntityManager em;

    @Override
    public Map<TraitProfile, BigDecimal> calculateScores(Integer attemptId) {

        String sql = """
            SELECT tp.id AS trait_id,
                   tp.code AS trait_code,
                   tp.name AS trait_name,
                   SUM(qot.weight) AS score
            FROM answers a
            JOIN question_option_traits qot ON qot.question_option_id = a.option_id
            JOIN trait_profiles tp ON tp.id = qot.trait_id
            WHERE a.attempt_id = :attemptId
            GROUP BY tp.id, tp.code, tp.name
            ORDER BY tp.code
        """;

        List<Object[]> rows = em.createNativeQuery(sql)
                .setParameter(ATTEMPT_ID_KEY, attemptId)
                .getResultList();

        Map<TraitProfile, BigDecimal> result = new HashMap<>();

        for (Object[] row : rows) {

            TraitProfile trait = new TraitProfile();
            trait.setId(((Number) row[0]).intValue());
            trait.setCode((String) row[1]);
            trait.setName((String) row[2]);

            BigDecimal score = (row[3] != null)
                    ? new BigDecimal(row[3].toString())
                    : BigDecimal.ZERO;

            result.put(trait, score);
        }

        return result;
    }
}
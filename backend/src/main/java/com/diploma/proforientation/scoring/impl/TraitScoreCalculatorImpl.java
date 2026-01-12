package com.diploma.proforientation.scoring.impl;

import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.scoring.TraitScoreCalculator;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.diploma.proforientation.util.Constants.ATTEMPT_ID;

@Component
@RequiredArgsConstructor
public class TraitScoreCalculatorImpl implements TraitScoreCalculator {

    @PersistenceContext
    private final EntityManager em;

    @Override
    public Map<TraitProfile, BigDecimal> calculateScores(Integer attemptId) {

        // 1️⃣ Weighted sum per trait from the answers of this attempt
        String weightedSumSql = """
            SELECT tp.id AS trait_id,
                   tp.code AS trait_code,
                   tp.name AS trait_name,
                   SUM(qot.weight) AS weighted_sum
            FROM answers a
            JOIN question_option_traits qot ON qot.question_option_id = a.option_id
            JOIN trait_profiles tp ON tp.id = qot.trait_id
            WHERE a.attempt_id = :attemptId
            GROUP BY tp.id, tp.code, tp.name
            ORDER BY tp.code
        """;

        List<Object[]> weightedRows = em.createNativeQuery(weightedSumSql)
                .setParameter(ATTEMPT_ID, attemptId)
                .getResultList();

        // 2️⃣ Max possible weighted sum per trait (for normalization)
        String maxSumSql = """
            SELECT tp.id AS trait_id,
                   SUM(qot.weight) AS max_sum
            FROM question_option_traits qot
            JOIN question_options qo ON qo.id = qot.question_option_id
            JOIN questions q ON q.id = qo.question_id
            JOIN trait_profiles tp ON tp.id = qot.trait_id
            WHERE q.id IN (
                SELECT qo2.question_id
                FROM answers a2
                JOIN question_options qo2 ON qo2.id = a2.option_id
                WHERE a2.attempt_id = :attemptId
            )
            GROUP BY tp.id
        """;

        List<Object[]> maxRows = em.createNativeQuery(maxSumSql)
                .setParameter(ATTEMPT_ID, attemptId)
                .getResultList();

        Map<Integer, BigDecimal> maxPerTrait = new HashMap<>();
        for (Object[] row : maxRows) {
            Integer traitId = ((Number) row[0]).intValue();
            BigDecimal max = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ONE;
            maxPerTrait.put(traitId, max);
        }

        // 3️⃣ Normalize each trait score (0–1)
        Map<TraitProfile, BigDecimal> result = new HashMap<>();
        for (Object[] row : weightedRows) {
            Integer traitId = ((Number) row[0]).intValue();
            String code = (String) row[1];
            String name = (String) row[2];

            BigDecimal weightedSum = row[3] != null ? new BigDecimal(row[3].toString()) : BigDecimal.ZERO;
            BigDecimal max = maxPerTrait.getOrDefault(traitId, BigDecimal.ONE);

            BigDecimal normalized = BigDecimal.ZERO;
            if (max.compareTo(BigDecimal.ZERO) > 0) {
                normalized = weightedSum.divide(max, 4, RoundingMode.HALF_UP);
            }

            TraitProfile trait = new TraitProfile();
            trait.setId(traitId);
            trait.setCode(code);
            trait.setName(name);

            result.put(trait, normalized);
        }

        return result;
    }
}
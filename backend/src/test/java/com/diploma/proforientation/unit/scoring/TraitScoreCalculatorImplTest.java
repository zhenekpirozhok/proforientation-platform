package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.scoring.impl.TraitScoreCalculatorImpl;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TraitScoreCalculatorImplTest {

    private EntityManager em;
    private TraitScoreCalculatorImpl calculator;
    private Query query;

    @BeforeEach
    void setup() {
        em = mock(EntityManager.class);
        query = mock(Query.class);
        calculator = new TraitScoreCalculatorImpl(em);
    }

    @Test
    void calculateScores_normalizesWeightedSums() {
        Integer attemptId = 1;

        Object[] weightedRow1 = new Object[]{1, "R", "Realistic", 5.0};
        Object[] weightedRow2 = new Object[]{2, "I", "Investigative", 3.0};
        List<Object[]> weightedRows = List.of(weightedRow1, weightedRow2);

        Object[] maxRow1 = new Object[]{1, 10.0}; // max for R
        Object[] maxRow2 = new Object[]{2, 6.0};  // max for I
        List<Object[]> maxRows = List.of(maxRow1, maxRow2);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("attemptId", attemptId)).thenReturn(query);

        when(query.getResultList()).thenReturn(weightedRows).thenReturn(maxRows);

        Map<TraitProfile, BigDecimal> scores = calculator.calculateScores(attemptId);

        assertThat(scores).hasSize(2);

        TraitProfile traitR = scores.keySet().stream().filter(t -> t.getCode().equals("R")).findFirst().orElse(null);
        TraitProfile traitI = scores.keySet().stream().filter(t -> t.getCode().equals("I")).findFirst().orElse(null);

        assertThat(traitR).isNotNull();
        assertThat(scores.get(traitR)).isEqualByComparingTo(BigDecimal.valueOf(5.0).divide(BigDecimal.valueOf(10.0), 4, BigDecimal.ROUND_HALF_UP));

        assertThat(traitI).isNotNull();
        assertThat(scores.get(traitI)).isEqualByComparingTo(BigDecimal.valueOf(3.0).divide(BigDecimal.valueOf(6.0), 4, BigDecimal.ROUND_HALF_UP));
    }

    @Test
    void calculateScores_handlesNullWeightedSum() {
        Integer attemptId = 2;

        Object[] weightedRow = new Object[]{3, "A", "Artistic", null};
        List<Object[]> weightedRows = List.<Object[]>of(weightedRow);

        Object[] maxRow = new Object[]{3, 4.0};
        List<Object[]> maxRows = List.<Object[]>of(maxRow);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("attemptId", attemptId)).thenReturn(query);
        when(query.getResultList()).thenReturn(weightedRows).thenReturn(maxRows);

        Map<TraitProfile, BigDecimal> scores = calculator.calculateScores(attemptId);

        assertThat(scores).hasSize(1);

        TraitProfile trait = scores.keySet().iterator().next();
        assertThat(trait.getCode()).isEqualTo("A");
        assertThat(scores.get(trait)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void calculateScores_handlesEmptyResults() {
        Integer attemptId = 3;

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("attemptId", attemptId)).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of()).thenReturn(List.of());

        Map<TraitProfile, BigDecimal> scores = calculator.calculateScores(attemptId);

        assertThat(scores).isEmpty();
    }
}
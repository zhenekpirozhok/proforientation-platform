package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.scoring.ml.impl.TraitScoreCalculatorImpl;
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
    void calculateScores_returnsCorrectMapping() {
        Integer attemptId = 1;

        Object[] row1 = new Object[]{1, "R", "Realistic", 5.0};
        Object[] row2 = new Object[]{2, "I", "Investigative", 3.5};

        List<Object[]> resultList = List.of(row1, row2);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("attemptId", attemptId)).thenReturn(query);
        when(query.getResultList()).thenReturn(resultList);

        Map<TraitProfile, BigDecimal> scores = calculator.calculateScores(attemptId);

        assertThat(scores).hasSize(2);

        TraitProfile traitR = scores.keySet().stream().filter(t -> t.getCode().equals("R")).findFirst().orElse(null);
        TraitProfile traitI = scores.keySet().stream().filter(t -> t.getCode().equals("I")).findFirst().orElse(null);

        assertThat(traitR).isNotNull();
        assertThat(scores.get(traitR)).isEqualByComparingTo(BigDecimal.valueOf(5.0));

        assertThat(traitI).isNotNull();
        assertThat(scores.get(traitI)).isEqualByComparingTo(BigDecimal.valueOf(3.5));
    }

    @Test
    void calculateScores_handlesNullScore() {
        Integer attemptId = 2;

        Object[] row = new Object[]{3, "A", "Artistic", null};

        List<Object[]> resultList = List.<Object[]>of(row);

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("attemptId", attemptId)).thenReturn(query);
        when(query.getResultList()).thenReturn(resultList);

        Map<TraitProfile, BigDecimal> scores = calculator.calculateScores(attemptId);

        assertThat(scores).hasSize(1);
        TraitProfile trait = scores.keySet().iterator().next();
        assertThat(trait.getCode()).isEqualTo("A");
        assertThat(scores.get(trait)).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void calculateScores_emptyResult_returnsEmptyMap() {
        Integer attemptId = 3;

        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter("attemptId", attemptId)).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of());

        Map<TraitProfile, BigDecimal> scores = calculator.calculateScores(attemptId);

        assertThat(scores).isEmpty();
    }
}
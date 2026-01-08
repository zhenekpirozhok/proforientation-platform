package com.diploma.proforientation.repository.spec;

import com.diploma.proforientation.dto.QuizMetricsFilter;
import com.diploma.proforientation.model.view.QuizPublicMetricsEntity;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static com.diploma.proforientation.util.Constants.*;

public final class QuizPublicMetricsSpecs {

    private QuizPublicMetricsSpecs() {
        throw new UnsupportedOperationException(UTILITY_CLASS);
    }

    public static Specification<QuizPublicMetricsEntity> byFilter(QuizMetricsFilter f) {
        return (root, query, cb) -> {
            if (f == null) return cb.conjunction();

            List<Predicate> predicates = new ArrayList<>();

            addEquals(predicates, cb, root, QUIZ_ID, f.quizId());
            addQuizStatus(predicates, cb, root, f);
            addEquals(predicates, cb, root, CATEGORY_ID, f.categoryId());
            addContainsIgnoreCase(predicates, cb, root, QUIZ_CODE, f.quizCodeContains());

            addIntRange(predicates, cb, root, ATTEMPTS_TOTAL, f.attemptsTotalMin(), f.attemptsTotalMax());
            addIntRange(predicates, cb, root, ATTEMPTS_SUBMITTED, f.attemptsSubmittedMin(), f.attemptsSubmittedMax());
            addIntRange(predicates, cb, root, QUESTIONS_TOTAL, f.questionsTotalMin(), f.questionsTotalMax());

            addIntRange(predicates, cb, root, ESTIMATED_DURATION_SECONDS, f.estimatedDurationMin(), f.estimatedDurationMax());
            addBigDecimalRange(predicates, cb, root, AVG_DURATION_SECONDS, f.avgDurationMin(), f.avgDurationMax());

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static void addQuizStatus(
            List<Predicate> predicates,
            CriteriaBuilder cb,
            Root<QuizPublicMetricsEntity> root,
            QuizMetricsFilter f
    ) {
        if (f.quizStatus() == null) return;

        Expression<String> statusAsText =
                cb.function(SQL_TEXT_FUNCTION, String.class, root.get(QUIZ_STATUS));

        predicates.add(cb.equal(statusAsText, f.quizStatus().name()));
    }

    private static void addEquals(
            List<Predicate> predicates,
            CriteriaBuilder cb,
            Root<QuizPublicMetricsEntity> root,
            String field,
            Object value
    ) {
        if (value == null) return;
        predicates.add(cb.equal(root.get(field), value));
    }

    private static void addContainsIgnoreCase(
            List<Predicate> predicates,
            CriteriaBuilder cb,
            Root<QuizPublicMetricsEntity> root,
            String field,
            String contains
    ) {
        if (contains == null || contains.isBlank()) return;

        predicates.add(cb.like(
                cb.lower(root.get(field)),
                PERCENT + contains.toLowerCase() + PERCENT
        ));
    }

    private static void addIntRange(
            List<Predicate> predicates,
            CriteriaBuilder cb,
            Root<QuizPublicMetricsEntity> root,
            String field,
            Integer min,
            Integer max
    ) {
        if (min != null) predicates.add(cb.ge(root.get(field), min));
        if (max != null) predicates.add(cb.le(root.get(field), max));
    }

    private static void addBigDecimalRange(
            List<Predicate> predicates,
            CriteriaBuilder cb,
            Root<QuizPublicMetricsEntity> root,
            String field,
            BigDecimal min,
            BigDecimal max
    ) {
        if (min != null) predicates.add(cb.ge(root.get(field), min));
        if (max != null) predicates.add(cb.le(root.get(field), max));
    }
}
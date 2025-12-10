package com.diploma.proforientation.repository;

import com.diploma.proforientation.model.Translation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TranslationRepository extends JpaRepository<Translation, Integer> {
    Optional<Translation> findByEntityTypeAndEntityIdAndFieldAndLocale(
            String entityType, Integer entityId, String field, String locale
    );

    List<Translation> findByEntityTypeAndEntityIdAndLocale(
            String entityType, Integer entityId, String locale
    );
}

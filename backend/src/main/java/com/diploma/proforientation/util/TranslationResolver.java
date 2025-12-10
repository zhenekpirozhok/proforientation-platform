package com.diploma.proforientation.util;

import com.diploma.proforientation.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TranslationResolver {

    private final TranslationService translationService;

    /**
     * Resolve translation for an entity-specific field.
     *
     * @param entityType like "quiz", "question", "question_option", "profession"
     * @param entityId the ID of the entity
     * @param field "title", "text", "description"
     * @param locale requested locale ("en", "ru", etc.)
     * @param fallback the default text stored in the entity
     */
    public String resolve(String entityType,
                          Integer entityId,
                          String field,
                          String locale,
                          String fallback) {

        String translated = translationService.translate(entityType, entityId, field, locale);
        return translated != null ? translated : fallback;
    }
}

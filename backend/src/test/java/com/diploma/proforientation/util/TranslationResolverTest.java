package com.diploma.proforientation.util;

import com.diploma.proforientation.service.TranslationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class TranslationResolverTest {

    @Mock
    private TranslationService translationService;

    private TranslationResolver translationResolver;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        translationResolver = new TranslationResolver(translationService);
    }

    @Test
    void resolve_translationExists_returnsTranslatedText() {
        String entityType = "quiz";
        Integer entityId = 1;
        String field = "title";
        String locale = "en";
        String fallback = "Default Title";

        when(translationService.translate(entityType, entityId, field, locale))
                .thenReturn("Translated Title");

        String result = translationResolver.resolve(entityType, entityId, field, locale, fallback);

        assertThat(result).isEqualTo("Translated Title");
        verify(translationService).translate(entityType, entityId, field, locale);
    }

    @Test
    void resolve_translationNotFound_returnsFallback() {
        String entityType = "question";
        Integer entityId = 2;
        String field = "text";
        String locale = "ru";
        String fallback = "Default Question Text";

        when(translationService.translate(entityType, entityId, field, locale))
                .thenReturn(null);

        String result = translationResolver.resolve(entityType, entityId, field, locale, fallback);

        assertThat(result).isEqualTo(fallback);
        verify(translationService).translate(entityType, entityId, field, locale);
    }

    @Test
    void resolve_translationEmpty_returnsFallback() {
        String entityType = "profession";
        Integer entityId = 3;
        String field = "description";
        String locale = "fr";
        String fallback = "Default Description";

        when(translationService.translate(entityType, entityId, field, locale))
                .thenReturn("");

        String result = translationResolver.resolve(entityType, entityId, field, locale, fallback);

        assertThat(result).isEqualTo(""); // keeps empty string if not null
        verify(translationService).translate(entityType, entityId, field, locale);
    }
}
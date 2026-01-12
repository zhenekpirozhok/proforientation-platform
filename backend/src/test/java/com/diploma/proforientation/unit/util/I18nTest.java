package com.diploma.proforientation.unit.util;

import com.diploma.proforientation.util.I18n;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

import static com.diploma.proforientation.util.Constants.DEFAULT_LOCALE;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class I18nTest {

    @AfterEach
    void tearDown() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void msg_shouldDelegateToMessageSource_withLocaleAndDefaultMessage() {
        MessageSource messageSource = mock(MessageSource.class);
        I18n i18n = new I18n(messageSource);

        LocaleContextHolder.setLocale(Locale.forLanguageTag("ru"));

        String key = "error.unexpected";
        Object[] args = new Object[]{"x", 123};

        when(messageSource.getMessage(key, args, key, Locale.forLanguageTag("ru")))
                .thenReturn("Произошла непредвиденная ошибка");

        String result = i18n.msg(key, args);

        assertEquals("Произошла непредвиденная ошибка", result);
        verify(messageSource).getMessage(key, args, key, Locale.forLanguageTag("ru"));
        verifyNoMoreInteractions(messageSource);
    }

    @Test
    void currentLanguage_shouldReturnLanguageFromLocaleContextHolder() {
        MessageSource messageSource = mock(MessageSource.class);
        I18n i18n = new I18n(messageSource);

        LocaleContextHolder.setLocale(Locale.forLanguageTag("lt"));

        assertEquals("lt", i18n.currentLanguage());
        verifyNoInteractions(messageSource);
    }

    @Test
    void currentLanguage_shouldFallbackToDefaultLocale_whenLanguageBlank() {
        MessageSource messageSource = mock(MessageSource.class);
        I18n i18n = new I18n(messageSource);

        Locale blankLangLocale = new Locale("", "");
        LocaleContextHolder.setLocale(blankLangLocale);

        assertEquals(DEFAULT_LOCALE, i18n.currentLanguage());
        verifyNoInteractions(messageSource);
    }
}
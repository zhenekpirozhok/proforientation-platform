package com.diploma.proforientation.unit.util;

import com.diploma.proforientation.util.LocaleProvider;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;

import java.util.Locale;

class LocaleProviderTest {

    @Test
    void currentLanguage_blank_returnsDefault() {
        LocaleContextHolder.setLocale(Locale.ROOT);

        LocaleProvider s = new LocaleProvider();
        Assertions.assertEquals("en", s.currentLanguage());
    }

    @Test
    void currentLanguage_ru_returnsRu() {
        LocaleContextHolder.setLocale(Locale.forLanguageTag("ru"));

        LocaleProvider s = new LocaleProvider();
        Assertions.assertEquals("ru", s.currentLanguage());
    }
}

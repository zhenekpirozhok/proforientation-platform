package com.diploma.proforientation.util;

import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import static com.diploma.proforientation.util.Constants.DEFAULT_LOCALE;

@Component
public class LocaleProvider {

    public String currentLanguage() {
        String lang = LocaleContextHolder.getLocale().getLanguage();
        return lang.isBlank() ? DEFAULT_LOCALE : lang;
    }
}
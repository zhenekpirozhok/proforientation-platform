package com.diploma.proforientation.util;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

import static com.diploma.proforientation.util.Constants.DEFAULT_LOCALE;

@Component
public class I18n {

    private final MessageSource messageSource;

    public I18n(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    public String msg(String key, Object... args) {
        return messageSource.getMessage(
                key,
                args,
                key,
                LocaleContextHolder.getLocale()
        );
    }

    public String msg(String key, Locale locale, Object... args) {
        return messageSource.getMessage(
                key,
                args,
                key,
                locale
        );
    }

    public String currentLanguage() {
        String lang = LocaleContextHolder.getLocale().getLanguage();
        return lang.isBlank() ? DEFAULT_LOCALE : lang;
    }
}
package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.service.EmailService;
import com.diploma.proforientation.util.I18n;
import com.diploma.proforientation.util.ResetPasswordLinkBuilder;
import lombok.AllArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.util.Locale;

import static com.diploma.proforientation.util.Constants.*;

@Service
@AllArgsConstructor
public class EmailServiceImpl implements EmailService {

    private final JavaMailSender mailSender;
    private final ResetPasswordLinkBuilder resetPasswordLinkBuilder;
    private final I18n i18n;

    public void sendResetPasswordEmail(String toEmail, String token, String localeStr) {

        Locale loc = (localeStr != null && !localeStr.isBlank())
                ? Locale.forLanguageTag(localeStr)
                : Locale.forLanguageTag(DEFAULT_LOCALE);

        String link = resetPasswordLinkBuilder.build(loc.getLanguage(), token);
        String subject = i18n.msg(EMAIL_RESET_SUBJECT, loc);
        String body = i18n.msg(EMAIL_RESET_BODY, loc, link);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        mailSender.send(message);
    }
}
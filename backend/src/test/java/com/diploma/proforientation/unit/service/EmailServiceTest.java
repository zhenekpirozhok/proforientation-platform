package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.service.impl.EmailServiceImpl;
import com.diploma.proforientation.util.I18n;
import com.diploma.proforientation.util.ResetPasswordLinkBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    private JavaMailSender mailSender;
    private ResetPasswordLinkBuilder linkBuilder;
    private I18n i18n;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        linkBuilder = mock(ResetPasswordLinkBuilder.class);
        i18n = mock(I18n.class);

        emailService = new EmailServiceImpl(mailSender, linkBuilder, i18n);
    }

    @Test
    void sendResetPasswordEmail_enLocale_sendsLocalizedEmailWithLink() {
        String recipient = "user@example.com";
        String token = "abc123";
        String localeStr = "en";

        String link = "http://localhost:3000/en/reset-password?token=" + token;

        when(linkBuilder.build("en", token)).thenReturn(link);
        when(i18n.msg("email.reset.subject", Locale.ENGLISH)).thenReturn("Password Reset Request");
        when(i18n.msg("email.reset.body", Locale.ENGLISH, link))
                .thenReturn("Click the link below to reset your password:\n" + link);

        emailService.sendResetPasswordEmail(recipient, token, localeStr);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();
        assertThat(msg.getTo()).containsExactly(recipient);
        assertThat(msg.getSubject()).isEqualTo("Password Reset Request");
        assertThat(msg.getText()).contains("Click the link below");
        assertThat(msg.getText()).contains(link);

        verify(linkBuilder).build("en", token);
        verify(i18n).msg("email.reset.subject", Locale.ENGLISH);
        verify(i18n).msg("email.reset.body", Locale.ENGLISH, link);
    }

    @Test
    void sendResetPasswordEmail_ruLocale_sendsLocalizedEmailWithLink() {
        String recipient = "user@example.com";
        String token = "abc123";
        String localeStr = "ru";

        String link = "http://localhost:3000/ru/reset-password?token=" + token;
        Locale ru = Locale.forLanguageTag("ru");

        when(linkBuilder.build("ru", token)).thenReturn(link);
        when(i18n.msg("email.reset.subject", ru)).thenReturn("Сброс пароля");
        when(i18n.msg("email.reset.body", ru, link))
                .thenReturn("Нажмите на ссылку ниже, чтобы сбросить пароль:\n" + link);

        emailService.sendResetPasswordEmail(recipient, token, localeStr);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();
        assertThat(msg.getTo()).containsExactly(recipient);
        assertThat(msg.getSubject()).isEqualTo("Сброс пароля");
        assertThat(msg.getText()).contains("Нажмите на ссылку ниже");
        assertThat(msg.getText()).contains(link);

        verify(linkBuilder).build("ru", token);
        verify(i18n).msg("email.reset.subject", ru);
        verify(i18n).msg("email.reset.body", ru, link);
    }

    @Test
    void sendResetPasswordEmail_nullLocale_defaultsToEn() {
        String recipient = "user@example.com";
        String token = "abc123";

        String link = "http://localhost:3000/en/reset-password?token=" + token;
        Locale en = Locale.ENGLISH;

        when(linkBuilder.build("en", token)).thenReturn(link);
        when(i18n.msg("email.reset.subject", en)).thenReturn("Password Reset Request");
        when(i18n.msg("email.reset.body", en, link)).thenReturn("Body\n" + link);

        emailService.sendResetPasswordEmail(recipient, token, null);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();
        assertThat(msg.getSubject()).isEqualTo("Password Reset Request");
        assertThat(msg.getText()).contains(link);

        verify(linkBuilder).build("en", token);
        verify(i18n).msg("email.reset.subject", en);
        verify(i18n).msg("email.reset.body", en, link);
    }
}
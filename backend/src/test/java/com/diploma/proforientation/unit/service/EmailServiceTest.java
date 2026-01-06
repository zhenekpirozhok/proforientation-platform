package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.service.impl.EmailServiceImpl;
import com.diploma.proforientation.util.ResetPasswordLinkBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.MessageSource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    private JavaMailSender mailSender;
    private ResetPasswordLinkBuilder linkBuilder;
    private MessageSource messageSource;

    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        linkBuilder = mock(ResetPasswordLinkBuilder.class);
        messageSource = mock(MessageSource.class);

        emailService = new EmailServiceImpl(mailSender, linkBuilder, messageSource);
    }

    @Test
    void sendResetPasswordEmail_enLocale_sendsLocalizedEmailWithLink() {
        String recipient = "user@example.com";
        String token = "abc123";
        String locale = "en";

        String link = "http://localhost:3000/en/reset-password?token=" + token;

        when(linkBuilder.build("en", token)).thenReturn(link);

        when(messageSource.getMessage(eq("email.reset.subject"), isNull(), eq(Locale.ENGLISH)))
                .thenReturn("Password Reset Request");

        when(messageSource.getMessage(eq("email.reset.body"), any(Object[].class), eq(Locale.ENGLISH)))
                .thenAnswer(inv -> {
                    Object[] args = inv.getArgument(1, Object[].class);
                    return "Click the link below to reset your password:\n" + args[0];
                });

        emailService.sendResetPasswordEmail(recipient, token, locale);

        ArgumentCaptor<SimpleMailMessage> captor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();

        assertThat(msg.getTo()).containsExactly(recipient);
        assertThat(msg.getSubject()).isEqualTo("Password Reset Request");
        assertThat(msg.getText()).contains("Click the link below to reset your password:");
        assertThat(msg.getText()).contains(link);

        verify(linkBuilder).build("en", token);
        verify(messageSource).getMessage("email.reset.subject", null, Locale.ENGLISH);
        verify(messageSource).getMessage(eq("email.reset.body"), any(Object[].class), eq(Locale.ENGLISH));
    }

    @Test
    void sendResetPasswordEmail_ruLocale_sendsLocalizedEmailWithLink() {
        String recipient = "user@example.com";
        String token = "abc123";
        String locale = "ru";

        String link = "http://localhost:3000/ru/reset-password?token=" + token;

        when(linkBuilder.build("ru", token)).thenReturn(link);

        Locale ru = Locale.forLanguageTag("ru");

        when(messageSource.getMessage(eq("email.reset.subject"), isNull(), eq(ru)))
                .thenReturn("Сброс пароля");

        when(messageSource.getMessage(eq("email.reset.body"), any(Object[].class), eq(ru)))
                .thenAnswer(inv -> {
                    Object[] args = inv.getArgument(1, Object[].class);
                    return "Нажмите на ссылку ниже, чтобы сбросить пароль:\n" + args[0];
                });

        emailService.sendResetPasswordEmail(recipient, token, locale);

        ArgumentCaptor<SimpleMailMessage> captor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();

        assertThat(msg.getTo()).containsExactly(recipient);
        assertThat(msg.getSubject()).isEqualTo("Сброс пароля");
        assertThat(msg.getText()).contains("Нажмите на ссылку ниже, чтобы сбросить пароль:");
        assertThat(msg.getText()).contains(link);

        verify(linkBuilder).build("ru", token);
        verify(messageSource).getMessage("email.reset.subject", null, ru);
        verify(messageSource).getMessage(eq("email.reset.body"), any(Object[].class), eq(ru));
    }

    @Test
    void sendResetPasswordEmail_nullLocale_defaultsToEn() {
        String recipient = "user@example.com";
        String token = "abc123";

        String link = "http://localhost:3000/en/reset-password?token=" + token;

        when(linkBuilder.build("en", token)).thenReturn(link);

        when(messageSource.getMessage(eq("email.reset.subject"), isNull(), eq(Locale.ENGLISH)))
                .thenReturn("Password Reset Request");

        when(messageSource.getMessage(eq("email.reset.body"), any(Object[].class), eq(Locale.ENGLISH)))
                .thenReturn("Body\n" + link);

        emailService.sendResetPasswordEmail(recipient, token, null);

        ArgumentCaptor<SimpleMailMessage> captor =
                ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());

        SimpleMailMessage msg = captor.getValue();

        assertThat(msg.getSubject()).isEqualTo("Password Reset Request");
        assertThat(msg.getText()).contains(link);

        verify(linkBuilder).build("en", token);
    }
}
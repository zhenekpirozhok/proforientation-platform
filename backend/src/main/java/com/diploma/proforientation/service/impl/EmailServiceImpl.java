package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.service.EmailService;
import com.diploma.proforientation.util.ResetPasswordLinkBuilder;
import lombok.AllArgsConstructor;
import org.springframework.context.MessageSource;
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
    private final MessageSource messageSource;

    public void sendResetPasswordEmail(String toEmail, String token, String locale) {

        Locale loc = Locale.forLanguageTag(
                locale != null ? locale : DEFAULT_LOCALE
        );

        String link = resetPasswordLinkBuilder.build(loc.getLanguage(), token);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(EMAIL_RESET_SUBJECT);
        message.setText(EMAIL_RESET_BODY + link);

        mailSender.send(message);
    }
}
package com.diploma.proforientation.service;


import com.diploma.proforientation.service.impl.EmailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

import static com.diploma.proforientation.service.impl.EmailServiceImpl.RESET_LINK;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailServiceTest {

    private JavaMailSender mailSender;
    private EmailServiceImpl emailService;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        emailService = new EmailServiceImpl(mailSender);
    }

    @Test
    void testSendResetPasswordEmailSendsCorrectMessage() {
        String recipient = "user@example.com";
        String token = "abc123";

        emailService.sendResetPasswordEmail(recipient, token);

        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);

        verify(mailSender, times(1)).send(captor.capture());

        SimpleMailMessage sentMessage = captor.getValue();

        assertNotNull(sentMessage);
        assertArrayEquals(new String[]{recipient}, sentMessage.getTo());
        assertEquals("Password Reset Request", sentMessage.getSubject());

        String expectedUrl = RESET_LINK + token;
        assertTrue(sentMessage.getText().contains(expectedUrl));

        assertTrue(sentMessage.getText().contains("Click the link to reset your password"));
    }
}
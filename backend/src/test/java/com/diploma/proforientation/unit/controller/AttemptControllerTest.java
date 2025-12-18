package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.AttemptController;
import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.request.AddAnswerRequest;
import com.diploma.proforientation.dto.request.AddAnswersBulkRequest;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.service.AttemptService;
import com.diploma.proforientation.util.AuthUtils;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.context.i18n.LocaleContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AttemptControllerTest {

    @Mock
    private AttemptService attemptService;

    @Mock
    private AuthUtils authUtils;

    @InjectMocks
    private AttemptController attemptController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        LocaleContextHolder.setLocale(Locale.ENGLISH);
    }

    @Test
    void testStartAttempt() {
        int quizVersionId = 1;
        int userId = 50;

        AttemptStartResponse mockResp = new AttemptStartResponse(100, "1");
        when(authUtils.getAuthenticatedUserId()).thenReturn(userId);
        when(attemptService.startAttempt(quizVersionId, userId)).thenReturn(mockResp);

        AttemptStartResponse response = attemptController.startAttempt(quizVersionId);

        assertEquals(mockResp, response);
        verify(attemptService).startAttempt(quizVersionId, userId);
    }

    @Test
    void testAddAnswer() {
        AddAnswerRequest req = new AddAnswerRequest(999);

        attemptController.addAnswer(10, req);

        verify(attemptService).addAnswer(10, 999);
    }

    @Test
    void testSubmit() {
        AttemptResultDto mockResult = new AttemptResultDto(
                Map.of("Logic", BigDecimal.TEN),
                List.of()
        );

        when(attemptService.submitAttempt(5)).thenReturn(mockResult);

        AttemptResultDto result = attemptController.submit(5);

        assertEquals(mockResult, result);
        verify(attemptService).submitAttempt(5);
    }

    @Test
    void testMyAttempts() {
        int userId = 33;
        String guestToken = "guest-abc";

        AttemptSummaryDto dto = new AttemptSummaryDto(
                1, 2, "Quiz", "FINISHED",
                Instant.now(), Instant.now(), true
        );

        when(authUtils.getAuthenticatedUserId()).thenReturn(userId);
        when(attemptService.getMyAttempts(userId, guestToken, "en"))
                .thenReturn(List.of(dto));

        List<AttemptSummaryDto> list = attemptController.myAttempts(guestToken);

        assertEquals(1, list.size());
        assertEquals(dto, list.getFirst());
        verify(attemptService).getMyAttempts(userId, guestToken, "en");
    }

    @Test
    void testGetResult() {
        AttemptResultDto mockResult = new AttemptResultDto(
                Map.of("Trait", BigDecimal.ONE),
                List.of(new RecommendationDto(1, BigDecimal.valueOf(1.0), "smth"))
        );

        when(attemptService.getResult(10)).thenReturn(mockResult);

        AttemptResultDto result = attemptController.getResult(10);

        assertEquals(mockResult, result);
        verify(attemptService).getResult(10);
    }

    @Test
    void testSearch() {
        Instant from = Instant.now().minusSeconds(1000);
        Instant to = Instant.now();

        AttemptSummaryDto dto = new AttemptSummaryDto(
                5, 10, "Math", "DONE",
                Instant.now(), Instant.now(), true
        );

        when(attemptService.adminSearchAttempts(1, 2, from, to, "en"))
                .thenReturn(List.of(dto));

        List<AttemptSummaryDto> result =
                attemptController.search(1, 2, from, to);

        assertEquals(1, result.size());
        assertEquals(dto, result.getFirst());

        verify(attemptService).adminSearchAttempts(1, 2, from, to, "en");
    }

    @Test
    void testStartAttempt_serviceThrows() {
        when(authUtils.getAuthenticatedUserId()).thenReturn(99);
        when(attemptService.startAttempt(1, 99))
                .thenThrow(new RuntimeException("Failed to start"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attemptController.startAttempt(1));

        assertEquals("Failed to start", ex.getMessage());
    }

    @Test
    void testAddAnswer_nullRequestBody() {
        assertThrows(NullPointerException.class, () ->
                attemptController.addAnswer(10, null)
        );

        verify(attemptService, never()).addAnswer(anyInt(), any());
    }

    @Test
    void testAddAnswer_serviceThrows() {
        AddAnswerRequest req = new AddAnswerRequest(555);

        doThrow(new RuntimeException("Bad answer"))
                .when(attemptService).addAnswer(10, 555);

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attemptController.addAnswer(10, req));

        assertEquals("Bad answer", ex.getMessage());
    }

    @Test
    void testSubmit_notFound() {
        when(attemptService.submitAttempt(999))
                .thenThrow(new RuntimeException("Attempt not found"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attemptController.submit(999));

        assertEquals("Attempt not found", ex.getMessage());
    }

    @Test
    void testMyAttempts_withoutGuestToken() {
        when(authUtils.getAuthenticatedUserId()).thenReturn(10);

        AttemptSummaryDto dto = new AttemptSummaryDto(
                1, 1, "Quiz", "STARTED",
                Instant.now(), null, false
        );

        when(attemptService.getMyAttempts(10, null, "en"))
                .thenReturn(List.of(dto));

        List<AttemptSummaryDto> list = attemptController.myAttempts(null);

        assertEquals(1, list.size());
        verify(attemptService).getMyAttempts(10, null, "en");
    }

    @Test
    void testMyAttempts_serviceThrows() {
        when(authUtils.getAuthenticatedUserId()).thenReturn(5);

        when(attemptService.getMyAttempts(5, "guest", "en"))
                .thenThrow(new RuntimeException("DB error"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attemptController.myAttempts("guest"));

        assertEquals("DB error", ex.getMessage());
    }

    @Test
    void testGetResult_serviceThrows() {
        when(attemptService.getResult(20))
                .thenThrow(new RuntimeException("Not allowed"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attemptController.getResult(20));

        assertEquals("Not allowed", ex.getMessage());
    }

    @Test
    void testSearch_allFiltersNull() {
        when(attemptService.adminSearchAttempts(null, null, null, null, "en"))
                .thenReturn(List.of());

        List<AttemptSummaryDto> result = attemptController.search(null, null, null, null);

        assertTrue(result.isEmpty());
        verify(attemptService).adminSearchAttempts(null, null, null, null, "en");
    }

    @Test
    void testSearch_serviceThrows() {
        Instant from = Instant.now().minusSeconds(500);
        Instant to = Instant.now();

        when(attemptService.adminSearchAttempts(5, 3, from, to, "en"))
                .thenThrow(new RuntimeException("Admin error"));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> attemptController.search(5, 3, from, to));

        assertEquals("Admin error", ex.getMessage());
    }

    @Test
    void testAddAnswersBulk_success() {
        AddAnswersBulkRequest req =
                new AddAnswersBulkRequest(List.of(1, 2, 3));

        attemptController.addAnswersBulk(10, req);

        verify(attemptService, times(1))
                .addAnswersBulk(10, List.of(1, 2, 3));
    }

    @Test
    void testAddAnswersBulk_nullRequest() {
        assertThrows(NullPointerException.class,
                () -> attemptController.addAnswersBulk(10, null));

        verify(attemptService, never())
                .addAnswersBulk(anyInt(), any());
    }

    @Test
    void testAddAnswersBulk_serviceThrows() {
        AddAnswersBulkRequest req =
                new AddAnswersBulkRequest(List.of(5, 6));

        doThrow(new IllegalStateException("Attempt already submitted"))
                .when(attemptService)
                .addAnswersBulk(10, List.of(5, 6));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> attemptController.addAnswersBulk(10, req)
        );

        assertEquals("Attempt already submitted", ex.getMessage());
    }

    @Test
    void testAddAnswersBulk_emptyOptions() {
        AddAnswersBulkRequest req =
                new AddAnswersBulkRequest(List.of());

        attemptController.addAnswersBulk(10, req);

        verify(attemptService)
                .addAnswersBulk(10, List.of());
    }

}
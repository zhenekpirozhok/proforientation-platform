package com.diploma.proforientation.integration.webmvc;

import com.diploma.proforientation.config.JwtAuthenticationFilter;
import com.diploma.proforientation.controller.AttemptController;
import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.request.add.AddAnswerRequest;
import com.diploma.proforientation.dto.request.add.AddAnswersBulkRequest;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.service.AttemptService;
import com.diploma.proforientation.util.AuthUtils;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.servlet.SecurityAutoConfiguration;
import org.springframework.boot.autoconfigure.security.servlet.SecurityFilterAutoConfiguration;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = AttemptController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientWebSecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration.class
        },
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.ASSIGNABLE_TYPE,
                        classes = JwtAuthenticationFilter.class
                )
        }
)
class AttemptControllerTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    ObjectMapper objectMapper;

    @MockitoBean
    AttemptService attemptService;

    @MockitoBean
    AuthUtils authUtils;

    @Test
    void startAttemptReturnsResponse() throws Exception {
        AttemptStartResponse response =
                new AttemptStartResponse(1, "token");

        Mockito.when(authUtils.getAuthenticatedUserId()).thenReturn(42);
        Mockito.when(attemptService.startAttempt(1, 42)).thenReturn(response);

        mockMvc.perform(post("/attempts/start")
                        .param("quizVersionId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.attemptId").value(1));
    }

    @Test
    void addAnswerReturnsOk() throws Exception {
        AddAnswerRequest req = new AddAnswerRequest(10);

        mockMvc.perform(post("/attempts/{id}/answers", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void addAnswersBulkReturnsOk() throws Exception {
        AddAnswersBulkRequest req =
                new AddAnswersBulkRequest(List.of(1, 2, 3));

        mockMvc.perform(post("/attempts/{id}/answers/bulk", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());
    }

    @Test
    void submitReturnsResult() throws Exception {
        AttemptResultDto result = new AttemptResultDto(
                List.of(),
                List.of()
        );

        Mockito.when(attemptService.submitAttempt(1))
                .thenReturn(result);

        mockMvc.perform(post("/attempts/{id}/submit", 1))
                .andExpect(status().isOk());
    }

    @Test
    void myAttemptsReturnsList() throws Exception {
        AttemptSummaryDto summary = new AttemptSummaryDto(
                1,
                10,
                "Personality Test",
                "COMPLETED",
                Instant.now(),
                Instant.now(),
                true
        );

        Mockito.when(authUtils.getAuthenticatedUserId()).thenReturn(42);
        Mockito.when(attemptService.getMyAttempts(eq(42), isNull()))
                .thenReturn(List.of(summary));

        mockMvc.perform(get("/attempts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }

    @Test
    void getResultReturnsDto() throws Exception {
        AttemptResultDto result = new AttemptResultDto(
                List.of(),
                List.of()
        );

        Mockito.when(attemptService.getResult(1))
                .thenReturn(result);

        mockMvc.perform(get("/attempts/{id}/result", 1))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminSearchAllowedForAdmin() throws Exception {
        AttemptSummaryDto summary = new AttemptSummaryDto(
                1,
                10,
                "Personality Test",
                "COMPLETED",
                Instant.now(),
                Instant.now(),
                true
        );

        Mockito.when(attemptService.adminSearchAttempts(
                        any(), any(), any(), any()))
                .thenReturn(List.of(summary));

        mockMvc.perform(get("/attempts/search")
                        .param("userId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", org.hamcrest.Matchers.hasSize(1)));
    }


    @Test
    void addAnswersForQuestion_validRequest_callsService_returns200() throws Exception {
        int attemptId = 5;

        String body = """
            {
              "questionId": 10,
              "optionIds": [100, 101, 102]
            }
            """;

        mockMvc.perform(post("/attempts/{attemptId}/answers/question", attemptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(attemptService).addAnswersForQuestion(
                attemptId,
                10,
                java.util.List.of(100, 101, 102)
        );
        verifyNoMoreInteractions(attemptService);
    }

    @Test
    void addAnswersForQuestion_missingQuestionId_returns400() throws Exception {
        int attemptId = 5;

        String body = """
            {
              "optionIds": [100, 101]
            }
            """;

        mockMvc.perform(post("/attempts/{attemptId}/answers/question", attemptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(attemptService);
    }

    @Test
    void addAnswersForQuestion_emptyBody_returns400() throws Exception {
        int attemptId = 5;

        mockMvc.perform(post("/attempts/{attemptId}/answers/question", attemptId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verifyNoInteractions(attemptService);
    }
}
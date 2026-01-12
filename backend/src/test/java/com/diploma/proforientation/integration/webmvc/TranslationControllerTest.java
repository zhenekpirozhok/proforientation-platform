package com.diploma.proforientation.integration.webmvc;

import com.diploma.proforientation.config.JwtAuthenticationFilter;
import com.diploma.proforientation.controller.AdvisorController;
import com.diploma.proforientation.controller.TranslationController;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;
import com.diploma.proforientation.service.TranslationService;
import org.junit.jupiter.api.BeforeEach;
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

import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(
        controllers = TranslationController.class,
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                SecurityFilterAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.oauth2.client.servlet.OAuth2ClientWebSecurityAutoConfiguration.class,
                org.springframework.boot.autoconfigure.security.oauth2.resource.servlet.OAuth2ResourceServerAutoConfiguration.class
        },
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.ASSIGNABLE_TYPE,
                        classes = {AdvisorController.class, JwtAuthenticationFilter.class}
                )
        }
)
class TranslationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TranslationService translationService;

    @Autowired
    private ObjectMapper objectMapper;

    private TranslationDto translationDto;

    @BeforeEach
    void setup() {
        translationDto = new TranslationDto(
                1,
                "JOB",
                10,
                "title",
                "en",
                "Software Engineer"
        );
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createTranslationReturnsDto() throws Exception {
        CreateTranslationRequest req =
                new CreateTranslationRequest(
                        "JOB",
                        10,
                        "title",
                        "en",
                        "Software Engineer"
                );

        Mockito.when(translationService.create(any(CreateTranslationRequest.class)))
                .thenReturn(translationDto);

        mockMvc.perform(post("/translations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text", is("Software Engineer")))
                .andExpect(jsonPath("$.entityType", is("JOB")));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateTranslationReturnsDto() throws Exception {
        UpdateTranslationRequest req = new UpdateTranslationRequest("Updated text");

        Mockito.when(translationService.update(eq(1), any(UpdateTranslationRequest.class)))
                .thenReturn(translationDto);

        mockMvc.perform(put("/translations/{id}", 1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(1)));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteTranslationReturnsOk() throws Exception {
        Mockito.doNothing().when(translationService).delete(1);

        mockMvc.perform(delete("/translations/{id}", 1))
                .andExpect(status().isOk());
    }

    @Test
    void searchTranslationsReturnsList() throws Exception {
        Mockito.when(translationService.search("JOB", 10, "en"))
                .thenReturn(List.of(translationDto));

        mockMvc.perform(get("/translations")
                        .param("entityType", "JOB")
                        .param("entityId", "10")
                        .param("locale", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].text", is("Software Engineer")));
    }

    @Test
    void getAllForEntityTypeReturnsList() throws Exception {
        Mockito.when(translationService.getAllForEntityType("JOB"))
                .thenReturn(List.of(translationDto));

        mockMvc.perform(get("/translations/entity/{entityType}", "JOB"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].entityType", is("JOB")));
    }
}
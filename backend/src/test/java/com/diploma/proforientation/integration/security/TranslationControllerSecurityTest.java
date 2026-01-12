package com.diploma.proforientation.integration.security;

import com.diploma.proforientation.config.JwtAuthenticationFilter;
import com.diploma.proforientation.controller.AdvisorController;
import com.diploma.proforientation.controller.TranslationController;
import com.diploma.proforientation.service.TranslationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = TranslationController.class,
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.ASSIGNABLE_TYPE,
                        classes = {AdvisorController.class, JwtAuthenticationFilter.class}
                )
        }
)
@EnableMethodSecurity
class TranslationControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    TranslationService translationService;

    @Test
    void createTranslationForbiddenWithoutAuth() throws Exception {
        mockMvc.perform(post("/translations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .contentType("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "USER")
    void createTranslationForbiddenForNonAdmin() throws Exception {
        mockMvc.perform(post("/translations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createTranslationAllowedForAdmin() throws Exception {
        mockMvc.perform(post("/translations")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }
}

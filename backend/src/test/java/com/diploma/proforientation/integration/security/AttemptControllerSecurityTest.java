package com.diploma.proforientation.integration.security;

import com.diploma.proforientation.config.JwtAuthenticationFilter;
import com.diploma.proforientation.controller.AttemptController;
import com.diploma.proforientation.service.AttemptService;
import com.diploma.proforientation.util.AuthUtils;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;


@WebMvcTest(
        controllers = AttemptController.class,
        excludeFilters = {
                @ComponentScan.Filter(
                        type = FilterType.ASSIGNABLE_TYPE,
                        classes = JwtAuthenticationFilter.class
                )
        }
)
@EnableMethodSecurity
class AttemptControllerSecurityTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    AttemptService attemptService;

    @MockitoBean
    AuthUtils authUtils;

    @Test
    @WithMockUser(roles = "ADMIN")
    void adminSearchAllowedForAdmin() throws Exception {
        mockMvc.perform(get("/attempts/search"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "USER")
    void adminSearchForbiddenForUser() throws Exception {
        mockMvc.perform(get("/attempts/search"))
                .andExpect(status().isForbidden());
    }
}
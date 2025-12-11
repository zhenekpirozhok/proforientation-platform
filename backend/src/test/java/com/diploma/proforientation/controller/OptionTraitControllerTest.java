package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.request.OptionTraitListRequest;
import com.diploma.proforientation.dto.request.OptionTraitRequest;
import com.diploma.proforientation.service.OptionTraitService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.Mockito.*;

class OptionTraitControllerTest {

    @Mock
    private OptionTraitService service;

    @InjectMocks
    private OptionTraitController controller;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
        SecurityContextHolder.clearContext();
    }

    private void setAdmin() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "admin",
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
                )
        );
    }

    @Test
    void assignTraits_asAdmin_shouldCallService() {
        setAdmin();

        OptionTraitListRequest req = new OptionTraitListRequest(
                List.of(new OptionTraitRequest(1, BigDecimal.valueOf(2.0)))
        );

        controller.assignTraits(10, req);

        verify(service).assignTraits(10, req.traits());
    }

    @Test
    void updateTraits_asAdmin_shouldCallService() {
        setAdmin();

        OptionTraitListRequest req = new OptionTraitListRequest(
                List.of(new OptionTraitRequest(2, BigDecimal.valueOf(3.0)))
        );

        controller.updateTraits(10, req);

        verify(service).updateTraits(10, req.traits());
    }
}
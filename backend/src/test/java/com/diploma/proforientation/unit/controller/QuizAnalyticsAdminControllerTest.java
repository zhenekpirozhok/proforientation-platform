package com.diploma.proforientation.unit.controller;

import com.diploma.proforientation.controller.QuizAnalyticsAdminController;
import com.diploma.proforientation.dto.analytics.QuizAnalyticsDetailedDto;
import com.diploma.proforientation.dto.analytics.QuizAnalyticsOverviewDto;
import com.diploma.proforientation.service.QuizAnalyticsService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

class QuizAnalyticsAdminControllerTest {

    @Mock
    private QuizAnalyticsService service;

    @InjectMocks
    private QuizAnalyticsAdminController controller;

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
    void overview_asAdmin_shouldReturnOverviewAnalytics() {
        setAdmin();

        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to = LocalDate.of(2024, 1, 31);

        QuizAnalyticsOverviewDto overview =
                new QuizAnalyticsOverviewDto(
                        10,
                        2,
                        100,
                        80,
                        BigDecimal.valueOf(0.8),
                        BigDecimal.valueOf(120),
                        List.of(
                                new QuizAnalyticsOverviewDto.DailyPoint(
                                        LocalDate.of(2024, 1, 10),
                                        10,
                                        8,
                                        BigDecimal.valueOf(130)
                                )
                        ),
                        List.of(
                                new QuizAnalyticsOverviewDto.TopProfession(
                                        1,
                                        "Software Engineer",
                                        25
                                )
                        )
                );

        when(service.getOverview(10, 2, from, to))
                .thenReturn(overview);

        QuizAnalyticsOverviewDto result =
                controller.overview(10, 2, from, to);

        assertThat(result.quizId()).isEqualTo(10);
        assertThat(result.quizVersionId()).isEqualTo(2);
        assertThat(result.attemptsCompleted()).isEqualTo(80);
        assertThat(result.topProfessions()).hasSize(1);

        verify(service).getOverview(10, 2, from, to);
    }

    @Test
    void overview_asAdmin_shouldAllowNullDates() {
        setAdmin();

        QuizAnalyticsOverviewDto overview =
                new QuizAnalyticsOverviewDto(
                        10,
                        1,
                        50,
                        40,
                        BigDecimal.valueOf(0.8),
                        BigDecimal.valueOf(90),
                        List.of(),
                        List.of()
                );

        when(service.getOverview(10, 1, null, null))
                .thenReturn(overview);

        QuizAnalyticsOverviewDto result =
                controller.overview(10, 1, null, null);

        assertThat(result.attemptsStarted()).isEqualTo(50);

        verify(service).getOverview(10, 1, null, null);
    }

    @Test
    void detailed_asAdmin_shouldReturnDetailedAnalytics() {
        setAdmin();

        QuizAnalyticsDetailedDto detailed =
                new QuizAnalyticsDetailedDto(
                        10,
                        2,
                        List.of(
                                new QuizAnalyticsDetailedDto.QuestionAvgChoice(
                                        1,
                                        1,
                                        BigDecimal.valueOf(2.4),
                                        100
                                )
                        ),
                        List.of(
                                new QuizAnalyticsDetailedDto.OptionDistribution(
                                        1,
                                        1,
                                        3,
                                        2,
                                        45
                                )
                        ),
                        List.of(
                                new QuizAnalyticsDetailedDto.QuestionDiscrimination(
                                        1,
                                        BigDecimal.valueOf(0.67),
                                        "GOOD",
                                        90
                                )
                        )
                );

        when(service.getDetailed(10, 2))
                .thenReturn(detailed);

        QuizAnalyticsDetailedDto result =
                controller.detailed(10, 2);

        assertThat(result.quizId()).isEqualTo(10);
        assertThat(result.quizVersionId()).isEqualTo(2);
        assertThat(result.avgChoicePerQuestion()).hasSize(1);
        assertThat(result.optionDistribution()).hasSize(1);
        assertThat(result.discrimination()).hasSize(1);

        verify(service).getDetailed(10, 2);
    }
}
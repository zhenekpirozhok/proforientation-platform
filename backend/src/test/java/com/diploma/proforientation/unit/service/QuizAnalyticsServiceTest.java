package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.analytics.QuizAnalyticsDetailedDto;
import com.diploma.proforientation.dto.analytics.QuizAnalyticsOverviewDto;
import com.diploma.proforientation.model.view.*;
import com.diploma.proforientation.repository.view.*;
import com.diploma.proforientation.service.QuizAnalyticsService;
import com.diploma.proforientation.service.impl.QuizAnalyticsServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class QuizAnalyticsServiceTest {

    @Mock QuizFunnelOverviewRepository funnelRepo;
    @Mock QuizActivityDailyRepository activityRepo;
    @Mock QuizTopProfessionRepository topProfRepo;

    @Mock QuizQuestionAvgChoiceRepository avgChoiceRepo;
    @Mock QuizQuestionOptionDistributionRepository distRepo;
    @Mock QuizQuestionDiscriminationRepository discRepo;

    QuizAnalyticsService service;

    @BeforeEach
    void setUp() {
        service = new QuizAnalyticsServiceImpl(
                funnelRepo,
                activityRepo,
                topProfRepo,
                avgChoiceRepo,
                distRepo,
                discRepo
        );
    }

    @Test
    void getOverview_withoutDateRange_usesUnboundedActivityQuery_andMapsResult() {
        Integer quizId = 1;
        Integer quizVersionId = 10;

        QuizFunnelOverviewEntity funnel = new QuizFunnelOverviewEntity();
        funnel.setId(new QuizFunnelOverviewEntity.Id(quizId, quizVersionId));
        funnel.setAttemptsStarted(100);
        funnel.setAttemptsCompleted(80);
        funnel.setCompletionRate(new BigDecimal("0.800000"));
        funnel.setAvgDurationSeconds(new BigDecimal("650.5"));

        when(funnelRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(funnel);

        QuizActivityDailyEntity d1 = new QuizActivityDailyEntity();
        d1.setId(new QuizActivityDailyEntity.Id(quizId, quizVersionId, LocalDate.of(2026, 1, 1)));
        d1.setAttemptsStarted(10);
        d1.setAttemptsCompleted(8);
        d1.setAvgDurationSeconds(new BigDecimal("600"));

        when(activityRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(d1));

        QuizTopProfessionEntity p1 = new QuizTopProfessionEntity();
        p1.setId(new QuizTopProfessionEntity.Id(quizId, quizVersionId, 7));
        p1.setProfessionTitle("Java Developer");
        p1.setTop1Count(12);

        when(topProfRepo.findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId))
                .thenReturn(List.of(p1));

        QuizAnalyticsOverviewDto dto = service.getOverview(quizId, quizVersionId, null, null);

        assertThat(dto.quizId()).isEqualTo(1);
        assertThat(dto.quizVersionId()).isEqualTo(10);
        assertThat(dto.attemptsStarted()).isEqualTo(100);
        assertThat(dto.attemptsCompleted()).isEqualTo(80);
        assertThat(dto.completionRate()).isEqualByComparingTo("0.800000");
        assertThat(dto.avgDurationSeconds()).isEqualByComparingTo("650.5");

        assertThat(dto.activityDaily()).hasSize(1);
        assertThat(dto.activityDaily().getFirst().day()).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(dto.activityDaily().getFirst().started()).isEqualTo(10);
        assertThat(dto.activityDaily().getFirst().completed()).isEqualTo(8);
        assertThat(dto.activityDaily().getFirst().avgDurationSeconds()).isEqualByComparingTo("600");

        assertThat(dto.topProfessions()).hasSize(1);
        assertThat(dto.topProfessions().getFirst().professionId()).isEqualTo(7);
        assertThat(dto.topProfessions().getFirst().professionTitle()).isEqualTo("Java Developer");
        assertThat(dto.topProfessions().getFirst().top1Count()).isEqualTo(12);

        verify(funnelRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        verify(activityRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        verify(activityRepo, never()).findByIdQuizIdAndIdQuizVersionIdAndIdDayBetween(any(), any(), any(), any());
        verify(topProfRepo).findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId);
        verifyNoMoreInteractions(funnelRepo, activityRepo, topProfRepo);
    }

    @Test
    void getOverview_withDateRange_usesBetweenQuery_andMapsResult() {
        Integer quizId = 2;
        Integer quizVersionId = 20;

        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 1, 31);

        QuizFunnelOverviewEntity funnel = new QuizFunnelOverviewEntity();
        funnel.setId(new QuizFunnelOverviewEntity.Id(quizId, quizVersionId));
        funnel.setAttemptsStarted(50);
        funnel.setAttemptsCompleted(25);
        funnel.setCompletionRate(new BigDecimal("0.500000"));
        funnel.setAvgDurationSeconds(new BigDecimal("400"));

        when(funnelRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(funnel);

        QuizActivityDailyEntity d = new QuizActivityDailyEntity();
        d.setId(new QuizActivityDailyEntity.Id(quizId, quizVersionId, LocalDate.of(2026, 1, 10)));
        d.setAttemptsStarted(5);
        d.setAttemptsCompleted(2);
        d.setAvgDurationSeconds(new BigDecimal("420"));

        when(activityRepo.findByIdQuizIdAndIdQuizVersionIdAndIdDayBetween(quizId, quizVersionId, from, to))
                .thenReturn(List.of(d));

        when(topProfRepo.findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId))
                .thenReturn(List.of());

        QuizAnalyticsOverviewDto dto = service.getOverview(quizId, quizVersionId, from, to);

        assertThat(dto.quizId()).isEqualTo(2);
        assertThat(dto.quizVersionId()).isEqualTo(20);
        assertThat(dto.activityDaily()).hasSize(1);
        assertThat(dto.activityDaily().getFirst().day()).isEqualTo(LocalDate.of(2026, 1, 10));

        verify(activityRepo).findByIdQuizIdAndIdQuizVersionIdAndIdDayBetween(quizId, quizVersionId, from, to);
        verify(activityRepo, never()).findByIdQuizIdAndIdQuizVersionId(any(), any());
    }

    @Test
    void getDetailed_mapsAvgChoiceDistributionAndDiscrimination() {
        Integer quizId = 3;
        Integer quizVersionId = 30;

        // avg choice
        QuizQuestionAvgChoiceEntity avg = new QuizQuestionAvgChoiceEntity();
        avg.setId(new QuizQuestionAvgChoiceEntity.Id(quizId, quizVersionId, 100));
        avg.setQuestionOrd(1);
        avg.setAvgChoice(new BigDecimal("2.5000"));
        avg.setAnswersCount(40);

        when(avgChoiceRepo.findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId))
                .thenReturn(List.of(avg));

        // distribution
        QuizQuestionOptionDistributionEntity dist = new QuizQuestionOptionDistributionEntity();
        dist.setId(new QuizQuestionOptionDistributionEntity.Id(quizId, quizVersionId, 100, 1000));
        dist.setQuestionOrd(1);
        dist.setOptionOrd(2);
        dist.setCount(10);

        when(distRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(dist));

        // discrimination
        QuizQuestionDiscriminationEntity disc = new QuizQuestionDiscriminationEntity();
        disc.setId(new QuizQuestionDiscriminationEntity.Id(quizId, quizVersionId, 100));
        disc.setDiscNorm(new BigDecimal("0.250000"));
        disc.setDiscQuality("ok");
        disc.setAttemptsSubmitted(80);

        when(discRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of(disc));

        QuizAnalyticsDetailedDto dto = service.getDetailed(quizId, quizVersionId);

        assertThat(dto.quizId()).isEqualTo(3);
        assertThat(dto.quizVersionId()).isEqualTo(30);

        assertThat(dto.avgChoicePerQuestion()).hasSize(1);
        assertThat(dto.avgChoicePerQuestion().getFirst().questionId()).isEqualTo(100);
        assertThat(dto.avgChoicePerQuestion().getFirst().questionOrd()).isEqualTo(1);
        assertThat(dto.avgChoicePerQuestion().getFirst().avgChoice()).isEqualByComparingTo("2.5000");
        assertThat(dto.avgChoicePerQuestion().getFirst().answersCount()).isEqualTo(40);

        assertThat(dto.optionDistribution()).hasSize(1);
        assertThat(dto.optionDistribution().getFirst().questionId()).isEqualTo(100);
        assertThat(dto.optionDistribution().getFirst().optionId()).isEqualTo(1000);
        assertThat(dto.optionDistribution().getFirst().optionOrd()).isEqualTo(2);
        assertThat(dto.optionDistribution().getFirst().count()).isEqualTo(10);

        assertThat(dto.discrimination()).hasSize(1);
        assertThat(dto.discrimination().getFirst().questionId()).isEqualTo(100);
        assertThat(dto.discrimination().getFirst().discNorm()).isEqualByComparingTo("0.250000");
        assertThat(dto.discrimination().getFirst().discQuality()).isEqualTo("ok");
        assertThat(dto.discrimination().getFirst().attemptsSubmitted()).isEqualTo(80);

        verify(avgChoiceRepo).findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId);
        verify(distRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        verify(discRepo).findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        verifyNoMoreInteractions(avgChoiceRepo, distRepo, discRepo);
    }

    @Test
    void getDetailed_emptyLists_returnsEmptyCollections() {
        Integer quizId = 4;
        Integer quizVersionId = 40;

        when(avgChoiceRepo.findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId))
                .thenReturn(List.of());
        when(distRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of());
        when(discRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId))
                .thenReturn(List.of());

        QuizAnalyticsDetailedDto dto = service.getDetailed(quizId, quizVersionId);

        assertThat(dto.avgChoicePerQuestion()).isEmpty();
        assertThat(dto.optionDistribution()).isEmpty();
        assertThat(dto.discrimination()).isEmpty();
    }
}
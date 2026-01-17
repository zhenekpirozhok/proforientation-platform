package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.analytics.*;
import com.diploma.proforientation.repository.view.*;
import com.diploma.proforientation.service.QuizAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class QuizAnalyticsServiceImpl implements QuizAnalyticsService {

    private final QuizFunnelOverviewRepository funnelRepo;
    private final QuizActivityDailyRepository activityRepo;
    private final QuizTopProfessionRepository topProfRepo;

    private final QuizQuestionModeChoiceRepository modeChoiceRepo;
    private final QuizQuestionOptionDistributionRepository distRepo;
    private final QuizQuestionDiscriminationRepository discRepo;

    public QuizAnalyticsOverviewDto getOverview(
            Integer quizId,
            Integer quizVersionId,
            LocalDate from,
            LocalDate to
    ) {
        var funnel = funnelRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);

        var activity = activityRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);

        if (from != null && to != null) {
            activity = activityRepo.findByIdQuizIdAndIdQuizVersionIdAndIdDayBetween(
                    quizId, quizVersionId, from, to
            );
        } else if (from != null) {
            activity = activityRepo.findByIdQuizIdAndIdQuizVersionIdAndIdDayGreaterThanEqual(
                    quizId, quizVersionId, from
            );
        } else if (to != null) {
            activity = activityRepo.findByIdQuizIdAndIdQuizVersionIdAndIdDayLessThanEqual(
                    quizId, quizVersionId, to
            );
        }

        var top = topProfRepo
                .findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(quizId, quizVersionId);

        var activityPoints = activity.stream()
                .filter(Objects::nonNull)
                .map(r -> new QuizAnalyticsOverviewDto.DailyPoint(
                        r.getId().getDay(),
                        r.getAttemptsStarted(),
                        r.getAttemptsCompleted(),
                        r.getAvgDurationSeconds()
                ))
                .toList();

        return new QuizAnalyticsOverviewDto(
                quizId,
                quizVersionId,
                funnel != null ? funnel.getAttemptsStarted() : 0,
                funnel != null ? funnel.getAttemptsCompleted() : 0,
                funnel != null ? funnel.getCompletionRate() : BigDecimal.ZERO,
                funnel != null ? funnel.getAvgDurationSeconds() : null,
                activityPoints,
                top.stream()
                        .filter(Objects::nonNull)
                        .map(r -> new QuizAnalyticsOverviewDto.TopProfession(
                                r.getId().getProfessionId(),
                                r.getProfessionTitle(),
                                r.getTop1Count()
                        ))
                        .toList()
        );
    }

    public QuizAnalyticsDetailedDto getDetailed(Integer quizId, Integer quizVersionId) {
        var modes = modeChoiceRepo.findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId);
        var dist = distRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        var disc = discRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);

        return new QuizAnalyticsDetailedDto(
                quizId,
                quizVersionId,
                modes.stream()
                        .filter(Objects::nonNull)
                        .map(r -> new QuizAnalyticsDetailedDto.QuestionModeChoice(
                                r.getId().getQuestionId(),
                                r.getQuestionOrd(),
                                r.getModeChoice(),
                                r.getModeCount(),
                                r.getAnswersCount()
                        ))
                        .toList(),
                dist.stream()
                        .filter(Objects::nonNull)
                        .map(r -> new QuizAnalyticsDetailedDto.OptionDistribution(
                                r.getId().getQuestionId(),
                                r.getQuestionOrd(),
                                r.getId().getOptionId(),
                                r.getOptionOrd(),
                                r.getCount()
                        ))
                        .toList(),
                disc.stream()
                        .filter(Objects::nonNull)
                        .map(r -> new QuizAnalyticsDetailedDto.QuestionDiscrimination(
                                r.getId().getQuestionId(),
                                r.getDiscNorm(),
                                r.getDiscQuality(),
                                r.getAttemptsSubmitted()
                        ))
                        .toList()
        );
    }
}
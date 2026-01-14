package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.analytics.*;
import com.diploma.proforientation.repository.view.*;
import com.diploma.proforientation.service.QuizAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class QuizAnalyticsServiceImpl implements QuizAnalyticsService {

    private final QuizFunnelOverviewRepository funnelRepo;
    private final QuizActivityDailyRepository activityRepo;
    private final QuizTopProfessionRepository topProfRepo;

    private final QuizQuestionAvgChoiceRepository avgChoiceRepo;
    private final QuizQuestionOptionDistributionRepository distRepo;
    private final QuizQuestionDiscriminationRepository discRepo;

    public QuizAnalyticsOverviewDto getOverview(
            Integer quizId,
            Integer quizVersionId,
            LocalDate from,
            LocalDate to
    ) {
        var funnel = funnelRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);

        var activity = (from != null && to != null)
                ? activityRepo.findByIdQuizIdAndIdQuizVersionIdAndIdDayBetween(
                quizId, quizVersionId, from, to
        )
                : activityRepo.findByIdQuizIdAndIdQuizVersionId(
                quizId, quizVersionId
        );

        var top = topProfRepo
                .findByIdQuizIdAndIdQuizVersionIdOrderByTop1CountDesc(
                        quizId,
                        quizVersionId
                );

        return new QuizAnalyticsOverviewDto(
                quizId,
                quizVersionId,
                funnel.getAttemptsStarted(),
                funnel.getAttemptsCompleted(),
                funnel.getCompletionRate(),
                funnel.getAvgDurationSeconds(),
                activity.stream()
                        .map(r -> new QuizAnalyticsOverviewDto.DailyPoint(
                                r.getId().getDay(),
                                r.getAttemptsStarted(),
                                r.getAttemptsCompleted(),
                                r.getAvgDurationSeconds()
                        ))
                        .toList(),
                top.stream()
                        .map(r -> new QuizAnalyticsOverviewDto.TopProfession(
                                r.getId().getProfessionId(),
                                r.getProfessionTitle(),
                                r.getTop1Count()
                        ))
                        .toList()
        );
    }

    public QuizAnalyticsDetailedDto getDetailed(Integer quizId, Integer quizVersionId) {
        var avg = avgChoiceRepo.findByIdQuizIdAndIdQuizVersionIdOrderByQuestionOrdAsc(quizId, quizVersionId);
        var dist = distRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);
        var disc = discRepo.findByIdQuizIdAndIdQuizVersionId(quizId, quizVersionId);

        return new QuizAnalyticsDetailedDto(
                quizId,
                quizVersionId,
                avg.stream().map(r ->
                        new QuizAnalyticsDetailedDto.QuestionAvgChoice(
                                r.getId().getQuestionId(),
                                r.getQuestionOrd(),
                                r.getAvgChoice(),
                                r.getAnswersCount()
                        )
                ).toList(),
                dist.stream().map(r ->
                        new QuizAnalyticsDetailedDto.OptionDistribution(
                                r.getId().getQuestionId(),
                                r.getQuestionOrd(),
                                r.getId().getOptionId(),
                                r.getOptionOrd(),
                                r.getCount()
                        )
                ).toList(),
                disc.stream().map(r ->
                        new QuizAnalyticsDetailedDto.QuestionDiscrimination(
                                r.getId().getQuestionId(),
                                r.getDiscNorm(),
                                r.getDiscQuality(),
                                r.getAttemptsSubmitted()
                        )
                ).toList()
        );
    }
}
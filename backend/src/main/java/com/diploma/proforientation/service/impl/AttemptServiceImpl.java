package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.AttemptService;

import com.diploma.proforientation.service.scoring.ScoringEngine;
import com.diploma.proforientation.service.scoring.ScoringEngineFactory;
import com.diploma.proforientation.service.scoring.ScoringResult;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttemptServiceImpl implements AttemptService {

    private static final String STATUS_IN_PROGRESS = "in_progress";
    private static final String STATUS_COMPLETED = "completed";

    private final AttemptRepository attemptRepo;
    private final UserRepository userRepo;
    private final QuizVersionRepository quizVersionRepo;
    private final AnswerRepository answerRepo;
    private final QuestionOptionRepository optionRepo;
    private final AttemptTraitScoreRepository traitScoreRepo;
    private final AttemptRecommendationRepository recRepo;
    private final ProfessionRepository professionRepo;

    private final ScoringEngineFactory scoringEngineFactory;

    @Override
    public AttemptStartResponse startAttempt(Integer quizVersionId, Integer userId) {

        Attempt attempt = new Attempt();

        QuizVersion qv = quizVersionRepo.findById(quizVersionId)
                .orElseThrow(() -> new EntityNotFoundException("Quiz version not found"));

        attempt.setQuizVersion(qv);

        if (userId != null) {
            attempt.setUser(userRepo.getReferenceById(userId));
        } else {
            attempt.setGuestToken(UUID.randomUUID().toString());
        }

        attempt = attemptRepo.save(attempt);
        return new AttemptStartResponse(attempt.getId(), attempt.getGuestToken());
    }

    @Override
    public void addAnswer(Integer attemptId, Integer optionId) {
        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found"));

        QuestionOption opt = optionRepo.findById(optionId)
                .orElseThrow(() -> new EntityNotFoundException("Option not found"));

        Answer ans = new Answer();
        ans.setAttempt(attempt);
        ans.setOption(opt);
        answerRepo.save(ans);
    }

    @Override
    public AttemptResultDto submitAttempt(Integer attemptId) {

        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found"));

        attempt.setSubmittedAt(Instant.now());
        attemptRepo.save(attempt);

        ScoringEngine engine = scoringEngineFactory.getEngine(
                attempt.getQuizVersion().getQuiz().getProcessingMode()
        );

        ScoringResult result = engine.evaluate(attemptId);

        // remove old results
        traitScoreRepo.deleteByAttempt_Id(attemptId);
        recRepo.deleteByAttempt_Id(attemptId);

        saveTraitScores(attempt, result.traitScores());
        saveRecommendations(attempt, result.recommendations());

        return new AttemptResultDto(
                toSimpleTraitMap(result.traitScores()),
                result.recommendations()
        );
    }

    @Override
    public List<AttemptSummaryDto> getMyAttempts(Integer userId, String guestToken) {

        List<Attempt> attempts;

        if (userId != null) {
            attempts = attemptRepo.findByUserIdOrderByStartedAtDesc(userId);
        } else {
            attempts = attemptRepo.findByGuestTokenOrderByStartedAtDesc(guestToken);
        }

        return attempts.stream()
                .map(this::toSummary)
                .toList();
    }

    @Override
    public AttemptResultDto getResult(Integer attemptId) {

        attemptRepo.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found"));

        List<AttemptTraitScore> scores = traitScoreRepo.findByAttemptId(attemptId);
        List<AttemptRecommendation> recs = recRepo.findByAttemptId(attemptId);

        Map<String, BigDecimal> traitMap = scores.stream()
                .collect(Collectors.toMap(
                        s -> s.getTrait().getCode(),
                        AttemptTraitScore::getScore
                ));

        List<RecommendationDto> recDtos = recs.stream()
                .map(r -> new RecommendationDto(
                        r.getProfession().getId(),
                        r.getScore(),
                        r.getLlmExplanation()
                ))
                .toList();

        return new AttemptResultDto(traitMap, recDtos);
    }

    @Override
    public List<AttemptSummaryDto> adminSearchAttempts(Integer userId, Integer quizId, Instant from, Instant to) {
        return attemptRepo.searchAdmin(userId, quizId, from, to)
                .stream()
                .map(this::toSummary)
                .toList();
    }

    private Map<String, BigDecimal> toSimpleTraitMap(Map<TraitProfile, BigDecimal> map) {
        return map.entrySet().stream()
                .collect(Collectors.toMap(e -> e.getKey().getCode(), Map.Entry::getValue));
    }

    private void saveTraitScores(Attempt attempt, Map<TraitProfile, BigDecimal> scores) {
        for (var entry : scores.entrySet()) {
            AttemptTraitScore score = new AttemptTraitScore();
            score.setAttempt(attempt);
            score.setTrait(entry.getKey());
            score.setScore(entry.getValue());
            traitScoreRepo.save(score);
        }
    }

    private void saveRecommendations(Attempt attempt, List<RecommendationDto> recs) {
        for (RecommendationDto dto : recs) {

            Profession prof = professionRepo.findById(dto.professionId())
                    .orElseThrow(() -> new EntityNotFoundException("Profession not found"));

            AttemptRecommendation ar = new AttemptRecommendation();
            ar.setAttempt(attempt);
            ar.setProfession(prof);
            ar.setScore(dto.score());
            ar.setLlmExplanation(dto.explanation());

            recRepo.save(ar);
        }
    }

    private AttemptSummaryDto toSummary(Attempt a) {
        Quiz quiz = a.getQuizVersion().getQuiz();

        return new AttemptSummaryDto(
                a.getId(),
                a.getQuizVersion().getId(),
                quiz.getTitleDefault(),  // later localized
                a.getSubmittedAt() == null ? STATUS_IN_PROGRESS : STATUS_COMPLETED,
                a.getStartedAt(),
                a.getSubmittedAt(),
                a.getSubmittedAt() != null
        );
    }
}
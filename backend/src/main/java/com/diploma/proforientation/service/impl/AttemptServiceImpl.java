package com.diploma.proforientation.service.impl;

import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.TraitScoreDto;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.AttemptService;

import com.diploma.proforientation.scoring.ScoringEngine;
import com.diploma.proforientation.scoring.ScoringEngineFactory;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static com.diploma.proforientation.util.Constants.*;

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
    private final TranslationResolver translationResolver;

    @Override
    public AttemptStartResponse startAttempt(Integer quizVersionId, Integer userId) {

        Attempt attempt = new Attempt();

        QuizVersion qv = quizVersionRepo.findById(quizVersionId)
                .orElseThrow(() -> new EntityNotFoundException(QUIZ_VERSION_NOT_FOUND));

        attempt.setQuizVersion(qv);

        if (userId != null) {
            attempt.setUser(userRepo.getReferenceById(userId));
            attempt.setGuestToken(null);
        } else {
            attempt.setUser(null);
            attempt.setGuestToken(UUID.randomUUID().toString());
        }

        attempt = attemptRepo.save(attempt);
        return new AttemptStartResponse(attempt.getId(), attempt.getGuestToken());
    }

    @Override
    @Transactional
    public void addAnswer(Integer attemptId, Integer optionId) {
        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException(ATTEMPT_NOT_FOUND));

        QuestionOption opt = optionRepo.findById(optionId)
                .orElseThrow(() -> new EntityNotFoundException(OPTION_NOT_FOUND));

        Answer ans = new Answer();
        ans.setAttempt(attempt);
        ans.setOption(opt);
        answerRepo.save(ans);
    }

    @Override
    @Transactional
    public void addAnswersBulk(Integer attemptId, List<Integer> optionIds) {

        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException(ATTEMPT_NOT_FOUND));

        if (attempt.getSubmittedAt() != null) {
            throw new IllegalStateException(ATTEMPT_SUBMITTED);
        }

        // Overwrite previous answers
        answerRepo.deleteByAttemptId(attemptId);

        List<QuestionOption> options = optionRepo.findAllById(optionIds);

        if (options.size() != optionIds.size()) {
            throw new IllegalArgumentException(OPTIONS_NOT_FOUND);
        }

        List<Answer> answers = options.stream()
                .map(option -> {
                    Answer a = new Answer();
                    a.setAttempt(attempt);
                    a.setOption(option);
                    a.setCreatedAt(Instant.now());
                    return a;
                })
                .toList();

        answerRepo.saveAll(answers);
    }

    @Override
    @Transactional
    public AttemptResultDto submitAttempt(Integer attemptId) {

        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException(ATTEMPT_NOT_FOUND));

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
                toTraitScoreDtos(result.traitScores()),
                result.recommendations()
        );
    }

    @Override
    public List<AttemptSummaryDto> getMyAttempts(Integer userId, String guestToken, String locale) {

        List<Attempt> attempts;

        if (userId != null) {
            attempts = attemptRepo.findByUserIdOrderByStartedAtDesc(userId);
        } else {
            attempts = attemptRepo.findByGuestTokenOrderByStartedAtDesc(guestToken);
        }

        return attempts.stream()
                .map(a -> toSummary(a, locale))
                .toList();
    }

    @Override
    public AttemptResultDto getResult(Integer attemptId) {

        attemptRepo.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException(ATTEMPT_NOT_FOUND));

        List<AttemptTraitScore> scores = traitScoreRepo.findByAttemptId(attemptId);
        List<AttemptRecommendation> recs = recRepo.findByAttemptId(attemptId);

        List<TraitScoreDto> traitScores = scores.stream()
                .map(s -> new TraitScoreDto(
                        s.getTrait().getCode(),
                        s.getScore()
                ))
                .sorted(Comparator.comparing(TraitScoreDto::traitCode))
                .toList();

        List<RecommendationDto> recDtos = recs.stream()
                .map(r -> new RecommendationDto(
                        r.getProfession().getId(),
                        r.getScore(),
                        r.getLlmExplanation()
                ))
                .toList();

        return new AttemptResultDto(traitScores, recDtos);
    }

    @Override
    public List<AttemptSummaryDto> adminSearchAttempts(
            Integer userId,
            Integer quizId,
            Instant from,
            Instant to,
            String locale
    ) {
        return attemptRepo.searchAdmin(userId, quizId, from, to)
                .stream()
                .map(a -> toSummary(a, locale))
                .toList();
    }

    @Transactional
    public void attachGuestAttempts(String guestToken, User user) {
        if (guestToken == null) return;

        List<Attempt> attempts = attemptRepo.findAllByGuestToken(guestToken);

        for (Attempt attempt : attempts) {
            attempt.setUser(user);
            attempt.setGuestToken(null);
        }
    }

    @Override
    @Transactional
    public void addAnswersForQuestion(Integer attemptId, Integer questionId, List<Integer> optionIds) {

        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException(ATTEMPT_NOT_FOUND));

        if (attempt.getSubmittedAt() != null) {
            throw new IllegalStateException(ATTEMPT_SUBMITTED);
        }

        answerRepo.deleteByAttemptIdAndQuestionId(attemptId, questionId);

        List<QuestionOption> options = optionRepo.findAllById(optionIds);

        if (options.size() != optionIds.size()) {
            throw new IllegalArgumentException(OPTIONS_NOT_FOUND);
        }

        boolean allBelongToQuestion = options.stream()
                .allMatch(o -> o.getQuestion() != null && Objects.equals(o.getQuestion().getId(), questionId));

        if (!allBelongToQuestion) {
            throw new IllegalArgumentException("Some options do not belong to questionId=" + questionId);
        }

        List<Answer> answers = options.stream()
                .map(option -> {
                    Answer a = new Answer();
                    a.setAttempt(attempt);
                    a.setOption(option);
                    a.setCreatedAt(Instant.now());
                    return a;
                })
                .toList();

        answerRepo.saveAll(answers);
    }

    private List<TraitScoreDto> toTraitScoreDtos(
            Map<TraitProfile, BigDecimal> scores
    ) {
        return scores.entrySet().stream()
                .map(e -> new TraitScoreDto(
                        e.getKey().getCode(),
                        e.getValue()
                ))
                .sorted(Comparator.comparing(TraitScoreDto::traitCode))
                .toList();
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
                    .orElseThrow(() -> new EntityNotFoundException(PROFESSION_NOT_FOUND));

            AttemptRecommendation ar = new AttemptRecommendation();
            ar.setAttempt(attempt);
            ar.setProfession(prof);
            ar.setScore(dto.score());
            ar.setLlmExplanation(dto.explanation());

            recRepo.save(ar);
        }
    }

    private AttemptSummaryDto toSummary(Attempt a, String locale) {
        Quiz quiz = a.getQuizVersion().getQuiz();

        String title = translationResolver.resolve(
                ENTITY_TYPE_QUIZ,
                quiz.getId(),
                FIELD_TITLE,
                locale,
                quiz.getTitleDefault()
        );

        return new AttemptSummaryDto(
                a.getId(),
                a.getQuizVersion().getId(),
                title,
                a.getSubmittedAt() == null ? STATUS_IN_PROGRESS : STATUS_COMPLETED,
                a.getStartedAt(),
                a.getSubmittedAt(),
                a.getSubmittedAt() != null
        );
    }
}
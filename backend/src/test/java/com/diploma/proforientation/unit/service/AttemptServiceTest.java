package com.diploma.proforientation.unit.service;

import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.TraitScoreDto;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.model.enumeration.QuizProcessingMode;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.impl.AttemptServiceImpl;
import com.diploma.proforientation.scoring.ScoringEngine;
import com.diploma.proforientation.scoring.impl.ScoringEngineFactory;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.util.I18n;
import com.diploma.proforientation.util.TranslationResolver;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.*;


import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.assertThatThrownBy;
import static org.assertj.core.api.AssertionsForClassTypes.tuple;
import static org.junit.Assert.assertThrows;
import static org.mockito.Mockito.*;

class AttemptServiceTest {

    @Mock AttemptRepository attemptRepo;
    @Mock UserRepository userRepo;
    @Mock QuizVersionRepository quizVersionRepo;
    @Mock AnswerRepository answerRepo;
    @Mock QuestionOptionRepository optionRepo;
    @Mock AttemptTraitScoreRepository traitScoreRepo;
    @Mock AttemptRecommendationRepository recRepo;
    @Mock ProfessionRepository professionRepo;
    @Mock ScoringEngineFactory scoringEngineFactory;
    @Mock ScoringEngine scoringEngine;
    @Mock TranslationResolver translationResolver;
    @Mock I18n localeProvider;

    @InjectMocks AttemptServiceImpl service;

    @BeforeEach
    void setup() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testStartAttempt_guest() {

        QuizVersion qv = new QuizVersion();
        qv.setId(10);

        Attempt saved = new Attempt();
        saved.setId(55);
        saved.setGuestToken("guest-123");

        when(quizVersionRepo.findById(10)).thenReturn(Optional.of(qv));
        when(attemptRepo.save(any())).thenReturn(saved);

        AttemptStartResponse res = service.startAttempt(10, null);

        assertThat(res.attemptId()).isEqualTo(55);
        assertThat(res.guestToken()).isEqualTo("guest-123");
    }

    @Test
    void testStartAttempt_user() {

        QuizVersion qv = new QuizVersion();
        qv.setId(10);

        User user = new User();
        user.setId(99);

        Attempt saved = new Attempt();
        saved.setId(77);

        when(quizVersionRepo.findById(10)).thenReturn(Optional.of(qv));
        when(userRepo.getReferenceById(99)).thenReturn(user);
        when(attemptRepo.save(any())).thenReturn(saved);

        AttemptStartResponse res = service.startAttempt(10, 99);

        assertThat(res.attemptId()).isEqualTo(77);
        assertThat(res.guestToken()).isNull();
    }

    @Test
    void testAddAnswer() {

        Attempt attempt = new Attempt();
        attempt.setId(1);

        QuestionOption opt = new QuestionOption();
        opt.setId(5);

        when(attemptRepo.findById(1)).thenReturn(Optional.of(attempt));
        when(optionRepo.findById(5)).thenReturn(Optional.of(opt));

        service.addAnswer(1, 5);

        verify(answerRepo, times(1)).save(any());
    }

    @Test
    void testSubmitAttempt() {

        Attempt attempt = new Attempt();
        attempt.setId(10);

        Quiz quiz = new Quiz();
        quiz.setProcessingMode(QuizProcessingMode.ML_RIASEC);

        QuizVersion qv = new QuizVersion();
        qv.setId(2);
        qv.setQuiz(quiz);

        attempt.setQuizVersion(qv);

        Map<TraitProfile, BigDecimal> traits = new HashMap<>();
        TraitProfile t = new TraitProfile();
        t.setCode("R");
        traits.put(t, BigDecimal.TEN);

        List<RecommendationDto> recs = List.of(
                new RecommendationDto(100, BigDecimal.ONE, "ok")
        );

        ScoringResult result = new ScoringResult(traits, recs);

        when(attemptRepo.findById(10)).thenReturn(Optional.of(attempt));
        when(scoringEngineFactory.getEngine(QuizProcessingMode.ML_RIASEC)).thenReturn(scoringEngine);
        when(scoringEngine.evaluate(10)).thenReturn(result);

        Profession prof = new Profession();
        prof.setId(100);
        when(professionRepo.findById(100)).thenReturn(Optional.of(prof));

        AttemptResultDto dto = service.submitAttempt(10);

        assertThat(dto.traitScores())
                .extracting(TraitScoreDto::traitCode, TraitScoreDto::score)
                .containsExactly(
                        tuple("R", BigDecimal.TEN)
                );
        assertThat(dto.recommendations()).hasSize(1);

        verify(traitScoreRepo, times(1)).deleteByAttempt_Id(10);
        verify(recRepo, times(1)).deleteByAttempt_Id(10);
        verify(traitScoreRepo, times(1)).save(any());
        verify(recRepo, times(1)).save(any());
    }

    @Test
    void testGetMyAttempts_user() {

        Attempt a = new Attempt();
        a.setId(5);
        a.setStartedAt(Instant.now());

        Quiz q = new Quiz();
        q.setId(1);
        q.setTitleDefault("RIASEC");

        QuizVersion qv = new QuizVersion();
        qv.setQuiz(q);
        a.setQuizVersion(qv);

        when(attemptRepo.findByUserIdAndDeletedAtIsNullOrderByStartedAtDesc(99))
                .thenReturn(List.of(a));

        when(localeProvider.currentLanguage()).thenReturn("en");

        when(translationResolver.resolve(
                eq("quiz"),
                eq(1),
                eq("title"),
                eq("en"),
                eq("RIASEC")
        )).thenReturn("RIASEC");

        List<AttemptSummaryDto> list =
                service.getMyAttempts(99, null);

        assertThat(list).hasSize(1);
        assertThat(list.getFirst().quizTitle()).isEqualTo("RIASEC");
    }

    @Test
    void testGetMyAttempts_guest() {

        Attempt a = new Attempt();
        a.setId(7);
        a.setGuestToken("abc");
        a.setStartedAt(Instant.now());

        Quiz q = new Quiz();
        q.setTitleDefault("RIASEC");
        QuizVersion qv = new QuizVersion();
        qv.setQuiz(q);
        a.setQuizVersion(qv);

        when(attemptRepo.findByGuestTokenAndDeletedAtIsNullOrderByStartedAtDesc("abc"))
                .thenReturn(List.of(a));

        List<AttemptSummaryDto> list = service.getMyAttempts(null, "abc");

        assertThat(list).hasSize(1);
        assertThat(list.getFirst().id()).isEqualTo(7);
    }

    @Test
    void testGetResult() {

        Attempt attempt = new Attempt();
        attempt.setId(10);
        when(attemptRepo.findById(10)).thenReturn(Optional.of(attempt));

        TraitProfile trait = new TraitProfile();
        trait.setCode("I");

        AttemptTraitScore ts = new AttemptTraitScore();
        ts.setTrait(trait);
        ts.setScore(BigDecimal.TEN);

        AttemptRecommendation ar = new AttemptRecommendation();
        Profession p = new Profession();
        p.setId(50);
        ar.setProfession(p);
        ar.setScore(BigDecimal.ONE);
        ar.setLlmExplanation("good");

        when(traitScoreRepo.findByAttemptId(10))
                .thenReturn(List.of(ts));

        when(recRepo.findByAttemptId(10))
                .thenReturn(List.of(ar));

        AttemptResultDto dto = service.getResult(10);

        assertThat(dto.traitScores())
                .extracting(TraitScoreDto::traitCode, TraitScoreDto::score)
                .containsExactly(
                        tuple("I", BigDecimal.TEN)
                );
        assertThat(dto.recommendations()).hasSize(1);
    }

    @Test
    void testAdminSearchAttempts() {

        Attempt a = new Attempt();
        a.setId(22);
        a.setStartedAt(Instant.now());

        Quiz q = new Quiz();
        q.setTitleDefault("RIASEC");
        QuizVersion qv = new QuizVersion();
        qv.setQuiz(q);
        a.setQuizVersion(qv);

        when(attemptRepo.searchAdmin(null, 5, null, null))
                .thenReturn(List.of(a));

        List<AttemptSummaryDto> list =
                service.adminSearchAttempts(null, 5, null, null);

        assertThat(list).hasSize(1);
        assertThat(list.getFirst().id()).isEqualTo(22);
    }

    @Test
    void testAddAnswersBulk_success() {

        Attempt attempt = new Attempt();
        attempt.setId(1);

        QuestionOption opt1 = new QuestionOption();
        opt1.setId(10);

        QuestionOption opt2 = new QuestionOption();
        opt2.setId(11);

        when(attemptRepo.findById(1)).thenReturn(Optional.of(attempt));
        when(optionRepo.findAllById(List.of(10, 11)))
                .thenReturn(List.of(opt1, opt2));

        service.addAnswersBulk(1, List.of(10, 11));

        verify(answerRepo, times(1)).deleteByAttemptId(1);
        verify(answerRepo, times(1))
                .saveAll(argThat(iterable -> {
                    int count = 0;
                    for (Object ignored : iterable) {
                        count++;
                    }
                    return count == 2;
                }));    }

    @Test
    void testAddAnswersBulk_attemptNotFound() {

        when(attemptRepo.findById(99)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class,
                () -> service.addAnswersBulk(99, List.of(1, 2)));

        verify(answerRepo, never()).saveAll(any());
    }

    @Test
    void testAddAnswersBulk_attemptAlreadySubmitted() {

        Attempt attempt = new Attempt();
        attempt.setId(1);
        attempt.setSubmittedAt(Instant.now());

        when(attemptRepo.findById(1)).thenReturn(Optional.of(attempt));

        assertThrows(IllegalStateException.class,
                () -> service.addAnswersBulk(1, List.of(1, 2)));

        verify(answerRepo, never()).deleteByAttemptId(any());
        verify(answerRepo, never()).saveAll(any());
    }

    @Test
    void testAddAnswersBulk_someOptionsNotFound() {

        Attempt attempt = new Attempt();
        attempt.setId(1);

        QuestionOption opt = new QuestionOption();
        opt.setId(10);

        when(attemptRepo.findById(1)).thenReturn(Optional.of(attempt));
        when(optionRepo.findAllById(List.of(10, 11)))
                .thenReturn(List.of(opt)); // only one found

        assertThrows(IllegalArgumentException.class,
                () -> service.addAnswersBulk(1, List.of(10, 11)));

        verify(answerRepo, times(1)).deleteByAttemptId(1);
        verify(answerRepo, never()).saveAll(any());
    }

    @Test
    void attachGuestAttempts_shouldAttachAttemptsToUser() {
        String guestToken = "guest-token-123";
        User user = new User();
        user.setId(1);

        Attempt attempt1 = new Attempt();
        attempt1.setGuestToken(guestToken);

        Attempt attempt2 = new Attempt();
        attempt2.setGuestToken(guestToken);

        when(attemptRepo.findAllByGuestTokenAndDeletedAtIsNull(guestToken))
                .thenReturn(List.of(attempt1, attempt2));

        service.attachGuestAttempts(guestToken, user);

        assertThat(attempt1.getUser()).isEqualTo(user);
        assertThat(attempt1.getGuestToken()).isNull();

        assertThat(attempt2.getUser()).isEqualTo(user);
        assertThat(attempt2.getGuestToken()).isNull();

        verify(attemptRepo, times(1)).findAllByGuestTokenAndDeletedAtIsNull(guestToken);
    }

    @Test
    void addAnswersForQuestion_overwritesOnlyThatQuestion() {
        Attempt attempt = new Attempt();
        attempt.setId(1);
        attempt.setSubmittedAt(null);

        Question q = new Question();
        q.setId(10);

        QuestionOption o1 = new QuestionOption();
        o1.setId(100);
        o1.setQuestion(q);

        QuestionOption o2 = new QuestionOption();
        o2.setId(101);
        o2.setQuestion(q);

        when(attemptRepo.findById(1)).thenReturn(Optional.of(attempt));
        when(optionRepo.findAllById(List.of(100, 101))).thenReturn(List.of(o1, o2));

        service.addAnswersForQuestion(1, 10, List.of(100, 101));

        verify(answerRepo).deleteByAttemptIdAndQuestionId(1, 10);
        verify(answerRepo).saveAll(anyList());
    }

    @Test
    void deleteSelectedAttempts_shouldSoftDelete_forUser_whenConfirmed() {
        User u = new User();
        u.setId(10);

        Attempt a1 = new Attempt();
        a1.setId(1);
        a1.setUser(u);
        a1.setDeletedAt(null);

        Attempt a2 = new Attempt();
        a2.setId(2);
        a2.setUser(u);
        a2.setDeletedAt(null);

        when(attemptRepo.findAllById(List.of(1, 2))).thenReturn(List.of(a1, a2));

        service.deleteSelectedAttempts(10, null, List.of(1, 2), true);

        assertThat(a1.getDeletedAt()).isNotNull();
        assertThat(a2.getDeletedAt()).isNotNull();
        verify(attemptRepo).findAllById(List.of(1, 2));
        verifyNoMoreInteractions(attemptRepo);
    }

    @Test
    void deleteSelectedAttempts_shouldSoftDelete_forGuest_whenConfirmed() {
        Attempt a1 = new Attempt();
        a1.setId(5);
        a1.setGuestToken("guest-xyz");
        a1.setDeletedAt(null);

        Attempt a2 = new Attempt();
        a2.setId(6);
        a2.setGuestToken("guest-xyz");
        a2.setDeletedAt(null);

        when(attemptRepo.findAllById(List.of(5, 6))).thenReturn(List.of(a1, a2));

        service.deleteSelectedAttempts(null, "guest-xyz", List.of(5, 6), true);

        assertThat(a1.getDeletedAt()).isNotNull();
        assertThat(a2.getDeletedAt()).isNotNull();
        verify(attemptRepo).findAllById(List.of(5, 6));
        verifyNoMoreInteractions(attemptRepo);
    }

    @Test
    void deleteSelectedAttempts_shouldThrow_whenNotConfirmed() {
        assertThatThrownBy(() ->
                service.deleteSelectedAttempts(10, null, List.of(1, 2), false)
        ).isInstanceOf(IllegalStateException.class);

        verifyNoInteractions(attemptRepo);
    }

    @Test
    void deleteSelectedAttempts_shouldThrow_whenAttemptsNotFound_sizeMismatch() {
        User u = new User();
        u.setId(10);

        Attempt a1 = new Attempt();
        a1.setId(1);
        a1.setUser(u);

        when(attemptRepo.findAllById(List.of(1, 2))).thenReturn(List.of(a1));

        assertThatThrownBy(() ->
                service.deleteSelectedAttempts(10, null, List.of(1, 2), true)
        ).isInstanceOf(EntityNotFoundException.class);

        verify(attemptRepo).findAllById(List.of(1, 2));
        verifyNoMoreInteractions(attemptRepo);
    }

    @Test
    void deleteSelectedAttempts_shouldThrow_whenUserTriesToDeleteOthersAttempt() {
        User owner = new User();
        owner.setId(99);

        Attempt a1 = new Attempt();
        a1.setId(1);
        a1.setUser(owner);

        when(attemptRepo.findAllById(List.of(1))).thenReturn(List.of(a1));

        assertThatThrownBy(() ->
                service.deleteSelectedAttempts(10, null, List.of(1), true)
        ).isInstanceOf(EntityNotFoundException.class);

        assertThat(a1.getDeletedAt()).isNull();

        verify(attemptRepo).findAllById(List.of(1));
        verifyNoMoreInteractions(attemptRepo);
    }

    @Test
    void deleteSelectedAttempts_shouldThrow_whenGuestTokenDoesNotMatch() {
        Attempt a1 = new Attempt();
        a1.setId(5);
        a1.setGuestToken("guest-A");

        when(attemptRepo.findAllById(List.of(5))).thenReturn(List.of(a1));

        assertThatThrownBy(() ->
                service.deleteSelectedAttempts(null, "guest-B", List.of(5), true)
        ).isInstanceOf(EntityNotFoundException.class);

        assertThat(a1.getDeletedAt()).isNull();

        verify(attemptRepo).findAllById(List.of(5));
        verifyNoMoreInteractions(attemptRepo);
    }

    @Test
    void deleteSelectedAttempts_shouldNotChangeDeletedAt_ifAlreadyDeleted() {
        User u = new User();
        u.setId(10);

        Attempt a1 = new Attempt();
        a1.setId(1);
        a1.setUser(u);
        Instant alreadyDeleted = Instant.now().minusSeconds(3600);
        a1.setDeletedAt(alreadyDeleted);

        when(attemptRepo.findAllById(List.of(1))).thenReturn(List.of(a1));

        service.deleteSelectedAttempts(10, null, List.of(1), true);

        assertThat(a1.getDeletedAt()).isEqualTo(alreadyDeleted);

        verify(attemptRepo).findAllById(List.of(1));
        verifyNoMoreInteractions(attemptRepo);
    }
}
package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.exception.LlmParsingException;
import com.diploma.proforientation.exception.LlmPromptException;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.AttemptRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.scoring.TraitScoreCalculator;
import com.diploma.proforientation.scoring.llm.LlmScoringEngineImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;

import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class LlmScoringEngineImplBranchTest {

    private OpenAiChatModel openAiChat;
    private AttemptRepository attemptRepo;
    private ProfessionRepository professionRepo;
    private TraitScoreCalculator traitScoreCalculator;

    private LlmScoringEngineImpl engine;

    @BeforeEach
    void setUp() {
        openAiChat = mock(OpenAiChatModel.class);
        attemptRepo = mock(AttemptRepository.class);
        professionRepo = mock(ProfessionRepository.class);
        traitScoreCalculator = mock(TraitScoreCalculator.class);

        engine = new LlmScoringEngineImpl(openAiChat, attemptRepo, professionRepo, traitScoreCalculator);
    }

    @Test
    void evaluate_happyPath_returnsTraitScoresAndRecommendations() {
        Attempt attempt = new Attempt();
        QuizVersion qv = new QuizVersion();
        Quiz quiz = new Quiz();
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(10);
        quiz.setCategory(cat);
        qv.setQuiz(quiz);
        attempt.setQuizVersion(qv);

        when(attemptRepo.findById(1)).thenReturn(Optional.of(attempt));

        TraitProfile t1 = new TraitProfile();
        t1.setCode("R");
        t1.setName("Realistic");
        t1.setDescription("Hands-on");

        Map<TraitProfile, BigDecimal> traits = Map.of(t1, new BigDecimal("0.75"));
        when(traitScoreCalculator.calculateScores(1)).thenReturn(traits);

        Profession p1 = new Profession();
        p1.setId(100);
        p1.setCode("DEV");
        p1.setDescription("Writes code");
        when(professionRepo.findByCategoryId(10)).thenReturn(List.of(p1));

        String llmJson = """
        {"recommendations":[{"professionId":100,"score":0.9,"explanation":"Matches traits"}]}
        """;

        ChatResponse response = mock(ChatResponse.class, RETURNS_DEEP_STUBS);
        when(response.getResult().getOutput().getContent()).thenReturn(llmJson);

        when(openAiChat.call(any(Prompt.class))).thenReturn(response);

        ScoringResult result = engine.evaluate(1);

        assertThat(result.traitScores()).containsEntry(t1, new BigDecimal("0.75"));
        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.recommendations().getFirst().professionId()).isEqualTo(100);

        ArgumentCaptor<Prompt> promptCaptor = ArgumentCaptor.forClass(Prompt.class);
        verify(openAiChat).call(promptCaptor.capture());
        assertThat(promptCaptor.getValue().getContents()).contains("career guidance assistant");
        assertThat(promptCaptor.getValue().getContents()).contains("\"traits\"");
        assertThat(promptCaptor.getValue().getContents()).contains("\"professions\"");
    }

    @Test
    void evaluate_llmReturnsCodeFenceJson_stripsFenceAndParses() {
        Attempt attempt = attemptWithCategoryId(10);
        when(attemptRepo.findById(2)).thenReturn(Optional.of(attempt));
        when(traitScoreCalculator.calculateScores(2)).thenReturn(Map.of());
        when(professionRepo.findByCategoryId(10)).thenReturn(List.of());

        String fenced = """
        ```json
        {"recommendations":[{"professionId":1,"score":0.5,"explanation":"ok"}]}
        ```
        """;

        ChatResponse response = mock(ChatResponse.class, RETURNS_DEEP_STUBS);
        when(response.getResult().getOutput().getContent()).thenReturn(fenced);

        when(openAiChat.call(any(Prompt.class))).thenReturn(response);

        ScoringResult result = engine.evaluate(2);

        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.recommendations().getFirst().professionId()).isEqualTo(1);
    }

    @Test
    void evaluate_invalidJsonFromLlm_throwsLlmParsingException() {
        Attempt attempt = attemptWithCategoryId(10);
        when(attemptRepo.findById(3)).thenReturn(Optional.of(attempt));
        when(traitScoreCalculator.calculateScores(3)).thenReturn(Map.of());
        when(professionRepo.findByCategoryId(10)).thenReturn(List.of());

        ChatResponse response = mock(ChatResponse.class, RETURNS_DEEP_STUBS);
        when(response.getResult().getOutput().getContent()).thenReturn("not json");

        when(openAiChat.call(any(Prompt.class))).thenReturn(response);

        assertThatThrownBy(() -> engine.evaluate(3))
                .isInstanceOf(LlmParsingException.class);
    }

    @Test
    void parseRecommendations_missingOrNotArray_returnsEmptyList() throws Exception {
        JsonNode jsonMissing = new ObjectMapper().readTree("{}");
        JsonNode jsonNotArray = new ObjectMapper().readTree("{\"recommendations\":{}}");

        List<?> list1 = invokeParseRecommendations(engine, jsonMissing);
        List<?> list2 = invokeParseRecommendations(engine, jsonNotArray);

        assertThat(list1).isEmpty();
        assertThat(list2).isEmpty();
    }

    @Test
    void buildPrompt_nullFieldsInTraitsAndProfessions_areReplacedWithDefaults() throws Exception {
        TraitProfile t = new TraitProfile(); // all null fields
        Map<TraitProfile, BigDecimal> traitScores = new HashMap<>();
        traitScores.put(t, null); // null score -> should become 0

        Profession p = new Profession(); // all null fields, id->0, strings->""
        List<Profession> profs = List.of(p);

        String prompt = invokeBuildPrompt(engine, traitScores, profs);

        assertThat(prompt).contains("\"traits\"");
        assertThat(prompt).contains("\"professions\"");
        assertThat(prompt).contains("\"output_format\"");
        assertThat(prompt).contains("\"score\":0");
        assertThat(prompt).contains("\"id\":0");
    }

    @Test
    void buildPrompt_whenMapperFails_throwsLlmPromptException() throws Exception {
        ObjectMapper broken = mock(ObjectMapper.class);
        when(broken.writeValueAsString(any())).thenThrow(new RuntimeException("boom"));

        Field mapperField = LlmScoringEngineImpl.class.getDeclaredField("mapper");
        mapperField.setAccessible(true);
        mapperField.set(engine, broken);

        assertThatThrownBy(() -> invokeBuildPrompt(engine, Map.of(), List.of()))
                .isInstanceOf(java.lang.reflect.InvocationTargetException.class)
                .hasCauseInstanceOf(LlmPromptException.class);
    }

    private Attempt attemptWithCategoryId(int categoryId) {
        Attempt attempt = new Attempt();
        QuizVersion qv = new QuizVersion();
        Quiz quiz = new Quiz();
        ProfessionCategory cat = new ProfessionCategory();
        cat.setId(categoryId);
        quiz.setCategory(cat);
        qv.setQuiz(quiz);
        attempt.setQuizVersion(qv);
        return attempt;
    }

    /**
     * Creates a minimal Spring AI ChatResponse graph returning content string.
     * Depending on your Spring AI version, these types may vary; adjust if needed.
     */
    private ChatResponse chatResponseWithContent(String content) {
        ChatResponse response = mock(ChatResponse.class, RETURNS_DEEP_STUBS);
        when(response.getResult().getOutput().getContent()).thenReturn(content);
        return response;
    }

    private List<?> invokeParseRecommendations(LlmScoringEngineImpl eng, JsonNode json) throws Exception {
        Method m = LlmScoringEngineImpl.class.getDeclaredMethod("parseRecommendations", JsonNode.class);
        m.setAccessible(true);
        return (List<?>) m.invoke(eng, json);
    }

    private String invokeBuildPrompt(LlmScoringEngineImpl eng,
                                     Map<TraitProfile, BigDecimal> traits,
                                     List<Profession> profs) throws Exception {
        Method m = LlmScoringEngineImpl.class.getDeclaredMethod(
                "buildPromptForRecommendations", Map.class, List.class
        );
        m.setAccessible(true);
        return (String) m.invoke(eng, traits, profs);
    }
}
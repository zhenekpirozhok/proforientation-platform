package com.diploma.proforientation.scoring.llm;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.exception.LlmParsingException;
import com.diploma.proforientation.exception.LlmPromptException;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.scoring.TraitScoreCalculator;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

import static com.diploma.proforientation.util.Constants.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class LlmScoringEngineImpl implements LlmScoringEngine {

    private static final String NOT_VALID_JSON_REGEX1 = "```";
    private static final String NOT_VALID_JSON_REGEX2 = "```json";

    private static final String KEY_RECOMMENDATIONS = "recommendations";
    private static final String KEY_PROFESSION_ID = "professionId";
    private static final String KEY_SCORE = "score";
    private static final String KEY_EXPLANATION = "explanation";
    private static final String KEY_ID = "id";
    private static final String KEY_CODE = "code";
    private static final String KEY_NAME = "name";
    private static final String KEY_DESCRIPTION = "description";
    private static final String KEY_TRAITS = "traits";
    private static final String KEY_PROFESSIONS = "professions";
    private static final String KEY_OUTPUT_FORMAT = "output_format";

    private final OpenAiChatModel openAiChat;
    private final AttemptRepository attemptRepo;
    private final ProfessionRepository professionRepo;
    private final TraitScoreCalculator traitScoreCalculator;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public ScoringResult evaluate(Integer attemptId) {

        Attempt attempt = attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException(ATTEMPT_NOT_FOUND));

        Map<TraitProfile, BigDecimal> traitScores = traitScoreCalculator.calculateScores(attemptId);

        Integer categoryId = attempt.getQuizVersion().getQuiz().getCategory().getId();
        List<Profession> professions = professionRepo.findByCategoryId(categoryId);

        String promptText = buildPromptForRecommendations(traitScores, professions);
        Prompt prompt = new Prompt(promptText);

        ChatResponse response = openAiChat.call(prompt);
        String content = response.getResult().getOutput().getContent();

        JsonNode json = parseJson(content);
        log.info("LLM request worked");

        List<RecommendationDto> recs = parseRecommendations(json);

        return new ScoringResult(traitScores, recs);
    }

    private JsonNode parseJson(String text) {
        try {
            if (text.startsWith(NOT_VALID_JSON_REGEX1)) {
                text = text.replace(NOT_VALID_JSON_REGEX2, EMPTY_STRING)
                        .replace(NOT_VALID_JSON_REGEX1, EMPTY_STRING)
                        .trim();
            }
            return mapper.readTree(text);
        } catch (Exception e) {
            throw new LlmParsingException(INVALID_JSON_FROM_LLM + text, e);
        }
    }

    private List<RecommendationDto> parseRecommendations(JsonNode json) {
        List<RecommendationDto> list = new ArrayList<>();
        JsonNode arr = json.get(KEY_RECOMMENDATIONS);
        if (arr == null || !arr.isArray()) return list;

        for (JsonNode node : arr) {
            list.add(new RecommendationDto(
                    node.get(KEY_PROFESSION_ID).asInt(),
                    BigDecimal.valueOf(node.get(KEY_SCORE).asDouble()),
                    node.get(KEY_EXPLANATION).asText()
            ));
        }
        return list;
    }

    /**
     * Build LLM prompt using trait scores and professions.
     * LLM should only generate recommendations + explanations.
     */
    private String buildPromptForRecommendations(Map<TraitProfile, BigDecimal> traitScores,
                                                 List<Profession> professions) {

        List<Map<String, Object>> traitsPayload = new ArrayList<>();
        for (Map.Entry<TraitProfile, BigDecimal> entry : traitScores.entrySet()) {
            TraitProfile t = entry.getKey();
            traitsPayload.add(Map.of(
                    KEY_CODE, t.getCode() != null ? t.getCode() : EMPTY_STRING,
                    KEY_NAME, t.getName() != null ? t.getName() : EMPTY_STRING,
                    KEY_DESCRIPTION, t.getDescription() != null ? t.getDescription() : EMPTY_STRING,
                    KEY_SCORE, entry.getValue() != null ? entry.getValue() : BigDecimal.ZERO
            ));
        }

        List<Map<String, Object>> profsPayload = new ArrayList<>();
        for (Profession p : professions) {
            profsPayload.add(Map.of(
                    KEY_ID, p.getId() != null ? p.getId() : 0,
                    KEY_CODE, p.getCode() != null ? p.getCode() : EMPTY_STRING,
                    KEY_DESCRIPTION, p.getDescription() != null ? p.getDescription() : EMPTY_STRING
            ));
        }

        Map<String, Object> outputFormat = new HashMap<>();
        outputFormat.put(KEY_RECOMMENDATIONS, "array of {professionId:int, score:number, explanation:string}");

        Map<String, Object> payload = new HashMap<>();
        payload.put(KEY_TRAITS, traitsPayload);
        payload.put(KEY_PROFESSIONS, profsPayload);
        payload.put(KEY_OUTPUT_FORMAT, outputFormat);

        try {
            return """
                    You are a career guidance assistant. Analyze the following trait scores and recommend professions.
                    IMPORTANT:
                    - Base reasoning only on provided traits.
                    - Return ONLY strict JSON with recommendations.
                    - Do NOT generate traits or invent new ones.
                    Payload:
                    """ + mapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new LlmPromptException(INVALID_PROMPT, e);
        }
    }
}
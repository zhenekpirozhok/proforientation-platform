package com.diploma.proforientation.scoring.llm;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.dto.ml.ScoringResult;
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
    private static final String TRAITS_KEY = "traits";
    private static final String TRAITS_SCHEMA = "object traitCode->number";
    private static final String RECOMMENDATIONS_KEY = "recommendations";
    private static final String RECOMMENDATIONS_SCHEMA = "array of {professionId:int, score:number, explanation:string}";
    private static final String PROFESSION_ID_KEY = "professionId";
    private static final String SCORE_KEY = "score";
    private static final String EXPLANATION_KEY = "explanation";
    private static final String ID_KEY = "id";
    private static final String CODE_KEY = "code";
    private static final String OUTPUT_FORMAT_KEY = "output_format";


    private final OpenAiChatModel openAiChat;

    private final AttemptRepository attemptRepo;
    private final AnswerRepository answerRepo;
    private final TraitProfileRepository traitRepo;
    private final ProfessionRepository professionRepo;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public ScoringResult evaluate(Integer attemptId) {

        attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException(ATTEMPT_NOT_FOUND));

        List<Answer> answers = answerRepo.findByAttemptId(attemptId);
        List<Profession> professions = professionRepo.findAll();

        String promptText = buildPrompt(answers, professions);
        Prompt prompt = new Prompt(promptText);

        ChatResponse response = openAiChat.call(prompt);
        String content = response.getResult().getOutput().getContent();

        JsonNode json = parseJson(content);

        log.info("LLM request worked");

        return new ScoringResult(
                parseTraits(json),
                parseRecommendations(json)
        );
    }

    public ScoringResult evaluateRaw(List<Integer> answers) {

        String promptText = buildPromptForRawAnswers(answers);
        Prompt prompt = new Prompt(promptText);
        ChatResponse response = openAiChat.call(prompt);
        String content = response.getResult().getOutput().getContent();
        JsonNode json = parseJson(content);

        Map<TraitProfile, BigDecimal> traits = parseTraits(json);
        List<RecommendationDto> recs = parseRecommendations(json);

        return new ScoringResult(traits, recs);
    }

    public JsonNode parseJson(String text) {
        try {
            if (text.startsWith(NOT_VALID_JSON_REGEX1)) {
                text = text.replaceAll(NOT_VALID_JSON_REGEX2, EMPTY_STRING)
                        .replaceAll(NOT_VALID_JSON_REGEX1, EMPTY_STRING)
                        .trim();
            }
            return new ObjectMapper().readTree(text);
        } catch (Exception e) {
            throw new RuntimeException(INVALID_JSON_FROM_LLM + text);
        }
    }

    public Map<TraitProfile, BigDecimal> parseTraits(JsonNode json) {
        Map<TraitProfile, BigDecimal> map = new HashMap<>();
        JsonNode traitsNode = json.get(TRAITS_KEY);
        if (traitsNode == null) return map;

        traitsNode.fieldNames().forEachRemaining(code -> {
            TraitProfile trait;
            trait = traitRepo.findByCode(code.toUpperCase())
                    .orElse(null);
            if (trait != null) {
                map.put(trait, BigDecimal.valueOf(traitsNode.get(code).asDouble()));
            }
        });
        return map;
    }

    public List<RecommendationDto> parseRecommendations(JsonNode json) {
        List<RecommendationDto> list = new ArrayList<>();
        JsonNode arr = json.get(RECOMMENDATIONS_KEY);
        if (arr == null || !arr.isArray()) return list;

        for (JsonNode node : arr) {
            list.add(new RecommendationDto(
                    node.get(PROFESSION_ID_KEY).asInt(),
                    BigDecimal.valueOf(node.get(SCORE_KEY).asDouble()),
                    node.get(EXPLANATION_KEY).asText()
            ));
        }
        return list;
    }

    private String buildPrompt(List<Answer> answers, List<Profession> professions) {
        Map<Question, List<Answer>> byQuestion = new LinkedHashMap<>();

        for (Answer a : answers) {
            Question q = a.getOption().getQuestion();
            byQuestion.computeIfAbsent(q, k -> new ArrayList<>()).add(a);
        }

        List<PromptQuestion> questions = byQuestion.entrySet().stream()
                .map(e -> {
                    Question q = e.getKey();
                    List<PromptOption> opts = e.getValue().stream()
                            .map(a -> new PromptOption(
                                    a.getOption().getId(),
                                    a.getOption().getLabelDefault()
                            ))
                            .toList();

                    String type = q.getQtype().name();
                    return new PromptQuestion(q.getId(), type, q.getTextDefault(), opts);
                })
                .toList();

        List<Map<String, Object>> profs = professions.stream()
                .map(p -> Map.<String, Object>of(
                        ID_KEY, p.getId(),
                        CODE_KEY, p.getCode()
                ))
                .toList();

        Map<String, Object> payload = Map.of(
                ENTITY_QUESTIONS, questions,
                ENTITY_PROFESSIONS, profs,
                OUTPUT_FORMAT_KEY, Map.of(
                        TRAITS_KEY, TRAITS_SCHEMA,
                        RECOMMENDATIONS_KEY, RECOMMENDATIONS_SCHEMA
                )
        );

        try {
            return """
               You are a career guidance scorer. Analyze the structured quiz answers below.
               IMPORTANT:
               - MULTI_CHOICE means multiple selectedOptions are intentional.
               - Return ONLY strict JSON, no markdown, no extra text.
               Payload:
               """ + mapper.writeValueAsString(payload);
        } catch (Exception e) {
            throw new RuntimeException(INVALID_PROMPT, e);
        }
    }

    private String buildPromptForRawAnswers(List<Integer> answers) {
        StringBuilder sb = new StringBuilder();

        sb.append("Analyze these 48 RIASEC answers. Return STRICT JSON only.\n\n");
        sb.append("""
            {
              "traits": { "R": number, "I": number, "A": number, "S": number, "E": number, "C": number },
              "recommendations": [
                { "professionId": int, "score": number, "explanation": "text" }
              ]
            }
            """);

        sb.append("\nAnswers:\n");
        for (int i = 0; i < answers.size(); i++) {
            sb.append(i + 1).append(": ").append(answers.get(i)).append("\n");
        }

        sb.append("\nProfessions:\n");
        professionRepo.findAll().forEach(p ->
                sb.append("{\"id\": ").append(p.getId()).append(", \"code\": \"")
                        .append(p.getCode()).append("\"},\n")
        );

        return sb.toString();
    }
}

record PromptOption(Integer optionId, String label) {}
record PromptQuestion(Integer questionId, String type, String text, List<PromptOption> selectedOptions) {}
package com.diploma.proforientation.service.scoring.llm;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.*;
import com.diploma.proforientation.service.scoring.ScoringResult;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
public class LlmScoringEngineImpl implements LlmScoringEngine {

    private final OpenAiChatModel openAiChat;

    private final AttemptRepository attemptRepo;
    private final AnswerRepository answerRepo;
    private final TraitProfileRepository traitRepo;
    private final ProfessionRepository professionRepo;

    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    public ScoringResult evaluate(Integer attemptId) {

        attemptRepo.findById(attemptId)
                .orElseThrow(() -> new RuntimeException("Attempt not found"));

        List<Answer> answers = answerRepo.findByAttemptId(attemptId);
        List<Profession> professions = professionRepo.findAll();

        String promptText = buildPrompt(answers, professions);
        Prompt prompt = new Prompt(promptText);

        ChatResponse response = openAiChat.call(prompt);
        String content = response.getResult().getOutput().getContent();

        JsonNode json = parseJson(content);

        return new ScoringResult(
                parseTraits(json),
                parseRecommendations(json)
        );
    }

    public ScoringResult evaluateRaw(List<Integer> answers) {

        if (answers.size() != 48) {
            throw new IllegalArgumentException("Exactly 48 answers required.");
        }

        String promptText = buildPromptForRawAnswers(answers);
        Prompt prompt = new Prompt(promptText);
        ChatResponse response = openAiChat.call(prompt);
        String content = response.getResult().getOutput().getContent();
        JsonNode json = parseJson(content);

        Map<TraitProfile, BigDecimal> traits = parseTraits(json);
        List<RecommendationDto> recs = parseRecommendations(json);

        return new ScoringResult(traits, recs);
    }

    private JsonNode parseJson(String text) {
        try {
            if (text.startsWith("```")) {
                text = text.replaceAll("```json", "")
                        .replaceAll("```", "")
                        .trim();
            }
            return new ObjectMapper().readTree(text);
        } catch (Exception e) {
            throw new RuntimeException("LLM returned invalid JSON: " + text);
        }
    }

    private Map<TraitProfile, BigDecimal> parseTraits(JsonNode json) {
        Map<TraitProfile, BigDecimal> map = new HashMap<>();
        JsonNode traitsNode = json.get("traits");
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

    private List<RecommendationDto> parseRecommendations(JsonNode json) {
        List<RecommendationDto> list = new ArrayList<>();
        JsonNode arr = json.get("recommendations");
        if (arr == null || !arr.isArray()) return list;

        for (JsonNode node : arr) {
            list.add(new RecommendationDto(
                    node.get("professionId").asInt(),
                    BigDecimal.valueOf(node.get("score").asDouble()),
                    node.get("explanation").asText()
            ));
        }
        return list;
    }

    private String buildPrompt(List<Answer> answers, List<Profession> professions) {
        StringBuilder sb = new StringBuilder();

        sb.append("Analyze the following quiz answers and return ONLY strict JSON.\n\n");

        sb.append("Answers:\n");
        answers.forEach(a ->
                sb.append("- ").append(a.getOption().getLabelDefault()).append("\n"));

        sb.append("\nProfessions:\n");
        professions.forEach(p ->
                sb.append("{\"id\": ").append(p.getId()).append(", \"code\": \"")
                        .append(p.getCode()).append("\"}\n")
        );

        sb.append("""
                
                Respond EXACTLY in this JSON format:
                {
                  "traits": { "TRAIT_CODE": number },
                  "recommendations": [
                    { "professionId": int, "score": number, "explanation": "text" }
                  ]
                }
                """);

        return sb.toString();
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
            sb.append((i + 1)).append(": ").append(answers.get(i)).append("\n");
        }

        sb.append("\nProfessions:\n");
        professionRepo.findAll().forEach(p ->
                sb.append("{\"id\": ").append(p.getId()).append(", \"code\": \"")
                        .append(p.getCode()).append("\"},\n")
        );

        return sb.toString();
    }
}
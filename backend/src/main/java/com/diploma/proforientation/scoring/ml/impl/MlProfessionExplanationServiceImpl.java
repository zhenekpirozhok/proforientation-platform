package com.diploma.proforientation.scoring.ml.impl;

import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.scoring.ml.MlProfessionExplanationService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.diploma.proforientation.util.Constants.EMPTY_STRING;

@Service
@RequiredArgsConstructor
public class MlProfessionExplanationServiceImpl implements MlProfessionExplanationService {

    private static final String PROMPT_HEADER = """
        You generate short profession explanations for quiz recommendations.
        Use ONLY the provided profession data. Do NOT invent facts.
        Return ONLY strict JSON, no markdown.
        """;
    private static final String PROMPT_OUTPUT_FORMAT = """
        Output format:
        {
          "explanations": {
            "PROFESSION_ID": "2-3 sentences explanation"
          }
        }
        """;
    private static final String PROMPT_PROFESSIONS_HEADER = "Professions:\n";
    private static final String JSON_EXPLANATIONS_KEY = "explanations";
    private static final String JSON_CODE_FENCE = "```";
    private static final String JSON_CODE_FENCE_JSON = "```json";
    private static final String DOUBLE_QUOTE = "\"";
    private static final String SINGLE_QUOTE = "'";
    private static final String ERROR_INVALID_JSON =
            "LLM returned invalid JSON: ";


    private final OpenAiChatModel openAiChat;
    private final ObjectMapper mapper = new ObjectMapper();

    /**
     * Returns map professionId -> explanation text.
     * Explanations are short and based only on profession data (title/description).
     */
    public Map<Integer, String> explainProfessions(List<Profession> professions) {
        if (professions == null || professions.isEmpty()) {
            return Map.of();
        }

        String promptText = buildPrompt(professions);
        ChatResponse response = openAiChat.call(new Prompt(promptText));
        String content = response.getResult().getOutput().getContent();

        JsonNode json = parseJson(content);

        Map<Integer, String> out = new HashMap<>();
        JsonNode explanations = json.get(JSON_EXPLANATIONS_KEY);

        if (explanations != null && explanations.isObject()) {
            explanations.fieldNames().forEachRemaining(idStr -> {
                try {
                    int id = Integer.parseInt(idStr);
                    out.put(id, explanations.get(idStr).asText());
                } catch (NumberFormatException ignored) {
                    // ignore unexpected keys
                }
            });
        }
        return out;
    }

    private String buildPrompt(List<Profession> professions) {
        StringBuilder sb = new StringBuilder();

        sb.append(PROMPT_HEADER).append("\n\n")
                .append(PROMPT_OUTPUT_FORMAT).append("\n\n")
                .append(PROMPT_PROFESSIONS_HEADER);

        for (Profession p : professions) {
            sb.append("{")
                    .append("\"id\":").append(p.getId()).append(",")
                    .append("\"code\":\"").append(escape(p.getCode())).append("\",")
                    .append("\"title\":\"").append(escape(p.getTitleDefault())).append("\",")
                    .append("\"description\":\"").append(escape(p.getDescription())).append("\"")
                    .append("}\n");
        }
        return sb.toString();
    }

    private JsonNode parseJson(String text) {
        try {
            String t = text.trim();
            if (t.startsWith(JSON_CODE_FENCE)) {
                t = t.replace(JSON_CODE_FENCE_JSON, EMPTY_STRING)
                        .replace(JSON_CODE_FENCE, EMPTY_STRING)
                        .trim();
            }
            return mapper.readTree(t);
        } catch (Exception e) {
            throw new RuntimeException(ERROR_INVALID_JSON + text, e);
        }
    }

    private String escape(String s) {
        return s == null ? EMPTY_STRING : s.replace(DOUBLE_QUOTE, SINGLE_QUOTE);
    }
}
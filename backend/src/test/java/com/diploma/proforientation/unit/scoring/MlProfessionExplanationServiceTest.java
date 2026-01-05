package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.model.Profession;
import com.diploma.proforientation.scoring.ml.impl.MlProfessionExplanationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatModel;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MlProfessionExplanationServiceTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    OpenAiChatModel openAiChat;
    MlProfessionExplanationServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new MlProfessionExplanationServiceImpl(openAiChat);
    }

    private Profession prof(int id, String code, String title, String desc) {
        Profession p = new Profession();
        p.setId(id);
        p.setCode(code);
        p.setTitleDefault(title);
        p.setDescription(desc);
        return p;
    }

    @Test
    void explainProfessions_nullList_returnsEmpty_andDoesNotCallLlm() {
        Map<Integer, String> result = service.explainProfessions(null);

        assertThat(result).isEmpty();
        verifyNoInteractions(openAiChat);
    }

    @Test
    void explainProfessions_emptyList_returnsEmpty_andDoesNotCallLlm() {
        Map<Integer, String> result = service.explainProfessions(List.of());

        assertThat(result).isEmpty();
        verifyNoInteractions(openAiChat);
    }

    @Test
    void explainProfessions_validJson_parsesMap() {
        List<Profession> profs = List.of(
                prof(1, "dev", "Developer", "Writes code"),
                prof(2, "qa", "QA", "Tests software")
        );

        String llmJson = """
            {
              "explanations": {
                "1": "Explanation one.",
                "2": "Explanation two."
              }
            }
            """;

        when(openAiChat.call(any(Prompt.class)).getResult().getOutput().getContent())
                .thenReturn(llmJson);

        Map<Integer, String> result = service.explainProfessions(profs);

        assertThat(result)
                .containsEntry(1, "Explanation one.")
                .containsEntry(2, "Explanation two.");

        verify(openAiChat, times(1)).call(any(Prompt.class));
    }

    @Test
    void explainProfessions_jsonWithCodeFences_parsesMap() {
        List<Profession> profs = List.of(prof(5, "ds", "Data Scientist", "Works with data"));

        String fenced = """
            ```json
            { "explanations": { "5": "Works with data and builds models." } }
            ```
            """;

        when(openAiChat.call(any(Prompt.class)).getResult().getOutput().getContent())
                .thenReturn(fenced);

        Map<Integer, String> result = service.explainProfessions(profs);

        assertThat(result).containsEntry(5, "Works with data and builds models.");
        verify(openAiChat, times(1)).call(any(Prompt.class));
    }

    @Test
    void explainProfessions_invalidJson_throwsRuntimeException() {
        List<Profession> profs = List.of(prof(1, "dev", "Developer", "Writes code"));

        when(openAiChat.call(any(Prompt.class)).getResult().getOutput().getContent())
                .thenReturn("NOT_JSON");

        assertThatThrownBy(() -> service.explainProfessions(profs))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("LLM returned invalid JSON");

        verify(openAiChat, times(1)).call(any(Prompt.class));
    }

    @Test
    void explainProfessions_missingExplanationsKey_returnsEmptyMap() {
        List<Profession> profs = List.of(prof(1, "dev", "Developer", "Writes code"));

        String llmJson = """
            { "somethingElse": { "1": "x" } }
            """;

        when(openAiChat.call(any(Prompt.class)).getResult().getOutput().getContent())
                .thenReturn(llmJson);

        Map<Integer, String> result = service.explainProfessions(profs);

        assertThat(result).isEmpty();
        verify(openAiChat, times(1)).call(any(Prompt.class));
    }

    @Test
    void explainProfessions_ignoresNonNumericKeys() {
        List<Profession> profs = List.of(prof(1, "dev", "Developer", "Writes code"));

        String llmJson = """
            {
              "explanations": {
                "abc": "should be ignored",
                "1": "valid"
              }
            }
            """;

        when(openAiChat.call(any(Prompt.class)).getResult().getOutput().getContent())
                .thenReturn(llmJson);

        Map<Integer, String> result = service.explainProfessions(profs);

        assertThat(result)
                .containsEntry(1, "valid")
                .doesNotContainKey(null);

        assertThat(result).hasSize(1);
    }
}
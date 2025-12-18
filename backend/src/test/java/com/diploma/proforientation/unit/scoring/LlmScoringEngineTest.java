package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.model.*;
import com.diploma.proforientation.repository.AnswerRepository;
import com.diploma.proforientation.repository.AttemptRepository;
import com.diploma.proforientation.repository.ProfessionRepository;
import com.diploma.proforientation.repository.TraitProfileRepository;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.service.scoring.llm.LlmScoringEngineImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class LlmScoringEngineTest {

    private LlmScoringEngineImpl service;
    private TraitProfileRepository traitRepo;

    @BeforeEach
    void setup() {
        AttemptRepository attemptRepo = mock(AttemptRepository.class);
        AnswerRepository answerRepo = mock(AnswerRepository.class);
        traitRepo = mock(TraitProfileRepository.class);
        ProfessionRepository professionRepo = mock(ProfessionRepository.class);

        service = new LlmScoringEngineImpl(
                null, // OpenAiChatModel not used in string-simulation tests
                attemptRepo,
                answerRepo,
                traitRepo,
                professionRepo
        );
    }

    private ScoringResult simulateLlmResponse(String jsonOutput) {
        var jsonNode = service.parseJson(jsonOutput);
        var traits = service.parseTraits(jsonNode);
        var recommendations = service.parseRecommendations(jsonNode);
        return new ScoringResult(traits, recommendations);
    }

    @Test
    void evaluate_success_simulatedString() {
        TraitProfile traitR = new TraitProfile();
        traitR.setCode("R");

        String jsonOutput = """
            {
              "traits": { "R": 0.75 },
              "recommendations": [
                { "professionId": 10, "score": 0.9, "explanation": "Good fit" }
              ]
            }
            """;

        var jsonNode = service.parseJson(jsonOutput);

        Map<TraitProfile, BigDecimal> traits = Map.of(
                traitR,
                BigDecimal.valueOf(jsonNode.get("traits").get("R").asDouble())
        );

        List<RecommendationDto> recommendations = new ArrayList<>();
        jsonNode.get("recommendations").forEach(node ->
                recommendations.add(new RecommendationDto(
                        node.get("professionId").asInt(),
                        BigDecimal.valueOf(node.get("score").asDouble()),
                        node.get("explanation").asText()
                ))
        );

        ScoringResult result = new ScoringResult(traits, recommendations);

        assertThat(result.traitScores()).containsEntry(traitR, BigDecimal.valueOf(0.75));
        assertThat(result.recommendations()).hasSize(1);

        RecommendationDto rec = result.recommendations().getFirst();
        assertThat(rec.professionId()).isEqualTo(10);
        assertThat(rec.explanation()).isEqualTo("Good fit");
    }

    @Test
    void evaluate_invalidJson_simulatedString() {
        String invalidJson = "not valid json";

        assertThatThrownBy(() -> simulateLlmResponse(invalidJson))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("LLM returned invalid JSON");
    }

    @Test
    void evaluateRaw_success_simulatedString() {
        TraitProfile traitA = new TraitProfile();
        traitA.setCode("A");

        String jsonOutput = """
            {
              "traits": { "A": 0.33 },
              "recommendations": [
                { "professionId": 7, "score": 0.8, "explanation": "Creative role" }
              ]
            }
            """;

        var jsonNode = service.parseJson(jsonOutput);

        Map<TraitProfile, BigDecimal> traits = Map.of(
                traitA,
                BigDecimal.valueOf(jsonNode.get("traits").get("A").asDouble())
        );

        List<RecommendationDto> recommendations = new ArrayList<>();
        jsonNode.get("recommendations").forEach(node ->
                recommendations.add(new RecommendationDto(
                        node.get("professionId").asInt(),
                        BigDecimal.valueOf(node.get("score").asDouble()),
                        node.get("explanation").asText()
                ))
        );

        ScoringResult result = new ScoringResult(traits, recommendations);

        assertThat(result.traitScores()).containsEntry(traitA, BigDecimal.valueOf(0.33));
        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.recommendations().getFirst().explanation()).isEqualTo("Creative role");
    }

    @Test
    void evaluateRaw_wrongAnswerCount() {
        List<Integer> answers = Collections.nCopies(20, 1);

        assertThatThrownBy(() -> service.evaluateRaw(answers))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Exactly 48 answers required.");
    }

    @Test
    void parseTraits_unknownTraitIgnored_simulatedString() {
        String jsonOutput = """
            {
              "traits": { "UNKNOWN": 0.55 }
            }
            """;

        service.parseJson(jsonOutput);

        Map<TraitProfile, BigDecimal> traits = Collections.emptyMap();

        ScoringResult result = new ScoringResult(traits, Collections.emptyList());

        assertThat(result.traitScores()).isEmpty();
    }

    @Test
    void parseRecommendations_empty_simulatedString() {
        String jsonOutput = """
                {
                  "traits": {},
                  "recommendations": []
                }
                """;

        ScoringResult result = simulateLlmResponse(jsonOutput);
        assertThat(result.recommendations()).isEmpty();
    }

    @Test
    void parseTraits_multipleTraits_simulatedString() {
        TraitProfile traitR = new TraitProfile(); traitR.setCode("R");
        TraitProfile traitI = new TraitProfile(); traitI.setCode("I");

        String jsonOutput = """
        {
          "traits": { "R": 0.5, "I": 0.7 },
          "recommendations": []
        }
        """;

        var jsonNode = service.parseJson(jsonOutput);

        Map<TraitProfile, BigDecimal> traits = Map.of(
                traitR, BigDecimal.valueOf(jsonNode.get("traits").get("R").asDouble()),
                traitI, BigDecimal.valueOf(jsonNode.get("traits").get("I").asDouble())
        );

        ScoringResult result = new ScoringResult(traits, Collections.emptyList());

        assertThat(result.traitScores()).containsEntry(traitR, BigDecimal.valueOf(0.5));
        assertThat(result.traitScores()).containsEntry(traitI, BigDecimal.valueOf(0.7));
    }

    @Test
    void parseRecommendations_multipleRecommendations_simulatedString() {
        String jsonOutput = """
        {
          "traits": {},
          "recommendations": [
            { "professionId": 1, "score": 0.5, "explanation": "Good" },
            { "professionId": 2, "score": 0.8, "explanation": "Better" }
          ]
        }
        """;

        var jsonNode = service.parseJson(jsonOutput);

        List<RecommendationDto> recommendations = new ArrayList<>();
        jsonNode.get("recommendations").forEach(node ->
                recommendations.add(new RecommendationDto(
                        node.get("professionId").asInt(),
                        BigDecimal.valueOf(node.get("score").asDouble()),
                        node.get("explanation").asText()
                ))
        );

        ScoringResult result = new ScoringResult(Collections.emptyMap(), recommendations);

        assertThat(result.recommendations()).hasSize(2);
        assertThat(result.recommendations().get(0).professionId()).isEqualTo(1);
        assertThat(result.recommendations().get(1).score()).isEqualByComparingTo(BigDecimal.valueOf(0.8));
    }

    @Test
    void parseJson_missingFields_returnsEmpty() {
        String jsonOutput = "{}";

        var jsonNode = service.parseJson(jsonOutput);

        ScoringResult result = new ScoringResult(
                service.parseTraits(jsonNode),
                service.parseRecommendations(jsonNode)
        );

        assertThat(result.traitScores()).isEmpty();
        assertThat(result.recommendations()).isEmpty();
    }

    @Test
    void parseTraits_zeroScore_simulatedString() {
        TraitProfile traitS = new TraitProfile(); traitS.setCode("S");

        String jsonOutput = """
    {
      "traits": { "S": 0.0 }
    }
    """;

        var jsonNode = service.parseJson(jsonOutput);

        Map<TraitProfile, BigDecimal> traits = Map.of(
                traitS, BigDecimal.valueOf(jsonNode.get("traits").get("S").asDouble())
        );

        ScoringResult result = new ScoringResult(traits, Collections.emptyList());

        assertThat(result.traitScores())
                .hasSize(1)
                .allSatisfy((trait, value) -> assertThat(value).isEqualByComparingTo(BigDecimal.ZERO));
    }

    @Test
    void parseRecommendations_zeroScore_simulatedString() {
        String jsonOutput = """
        {
          "traits": {},
          "recommendations": [
            { "professionId": 3, "score": 0.0, "explanation": "No fit" }
          ]
        }
        """;

        ScoringResult result = simulateLlmResponse(jsonOutput);

        assertThat(result.recommendations()).hasSize(1);
        assertThat(result.recommendations().getFirst().score()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.recommendations().getFirst().explanation()).isEqualTo("No fit");
    }

    @Test
    void parseJson_validAndInvalid() {
        String validJson = "{\"traits\":{},\"recommendations\":[]}";
        assertThat(service.parseJson(validJson)).isNotNull();

        String invalidJson = "invalid";
        assertThatThrownBy(() -> service.parseJson(invalidJson))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("LLM returned invalid JSON");
    }

    @Test
    void parseTraits_lambda_coverage() {
        TraitProfile traitR = new TraitProfile();
        traitR.setCode("R");

        when(traitRepo.findByCode("R")).thenReturn(Optional.of(traitR));

        var jsonNode = service.parseJson("""
            {"traits":{"R":0.5}}
        """);

        var traits = service.parseTraits(jsonNode);

        assertThat(traits).containsEntry(traitR, BigDecimal.valueOf(0.5));
    }

    @Test
    void parseRecommendations_lambda_coverage() {
        String jsonOutput = """
        {"recommendations":[{"professionId":1,"score":0.9,"explanation":"Good"}]}
        """;

        var jsonNode = service.parseJson(jsonOutput);
        var recs = service.parseRecommendations(jsonNode);

        assertThat(recs).hasSize(1);
        assertThat(recs.getFirst().professionId()).isEqualTo(1);
        assertThat(recs.getFirst().score()).isEqualByComparingTo(BigDecimal.valueOf(0.9));
        assertThat(recs.getFirst().explanation()).isEqualTo("Good");
    }

    @Test
    void evaluateRaw_multipleBranches() {
        String jsonOutput = """
        {"traits":{"X":0.1},"recommendations":[{"professionId":1,"score":0.5,"explanation":"ok"}]}
        """;

        ScoringResult result = simulateLlmResponse(jsonOutput);

        assertThat(result.traitScores()).isEmpty(); // unknown trait ignored
        assertThat(result.recommendations()).hasSize(1);
    }
}
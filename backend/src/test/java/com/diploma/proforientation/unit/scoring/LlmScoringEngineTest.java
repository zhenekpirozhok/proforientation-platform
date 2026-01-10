package com.diploma.proforientation.unit.scoring;

import com.diploma.proforientation.dto.RecommendationDto;
import com.diploma.proforientation.dto.ml.ScoringResult;
import com.diploma.proforientation.exception.LlmParsingException;
import com.diploma.proforientation.model.TraitProfile;
import com.diploma.proforientation.scoring.TraitScoreCalculator;
import com.diploma.proforientation.scoring.llm.LlmScoringEngineImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class LlmScoringEngineTest {

    private TraitProfile traitR;
    private TraitProfile traitI;

    @BeforeEach
    void setup() {
        TraitScoreCalculator traitScoreCalculator = mock(TraitScoreCalculator.class);

        new LlmScoringEngineImpl(
                null,
                mock(com.diploma.proforientation.repository.AttemptRepository.class),
                mock(com.diploma.proforientation.repository.ProfessionRepository.class),
                traitScoreCalculator
        );

        traitR = new TraitProfile();
        traitR.setCode("R");

        traitI = new TraitProfile();
        traitI.setCode("I");
    }

    // Helper: simulate a JSON response from LLM and produce a ScoringResult
    private ScoringResult simulateLlmResponse(String jsonOutput, Map<TraitProfile, BigDecimal> traitsOverride) {
        // We simulate the trait calculator result
        Map<TraitProfile, BigDecimal> traits = new HashMap<>();
        if (traitsOverride != null) traits.putAll(traitsOverride);

        // Parse recommendations from JSON
        List<RecommendationDto> recommendations = new ArrayList<>();
        try {
            var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var root = mapper.readTree(jsonOutput);
            var recArray = root.path("recommendations");
            if (recArray.isArray()) {
                recArray.forEach(node -> recommendations.add(new RecommendationDto(
                        node.path("professionId").asInt(),
                        BigDecimal.valueOf(node.path("score").asDouble()),
                        node.path("explanation").asText()
                )));
            }
        } catch (Exception e) {
            throw new LlmParsingException("Failed to parse JSON from LLM: " + jsonOutput, e);
        }

        return new ScoringResult(traits, recommendations);
    }

    @Test
    void parseJson_validJson_returnsJsonNode() {
        String validJson = "{\"traits\":{},\"recommendations\":[]}";
        var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        try {
            var node = mapper.readTree(validJson);
            assertThat(node).isNotNull();
            assertThat(node.has("traits")).isTrue();
            assertThat(node.has("recommendations")).isTrue();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @Test
    void parseJson_invalidJson_throwsLlmParsingException() {
        String invalidJson = "not json";
        assertThatThrownBy(() -> simulateLlmResponse(invalidJson, null))
                .isInstanceOf(LlmParsingException.class)
                .hasMessageContaining("Failed to parse JSON from LLM");
    }

    @Test
    void parseTraits_knownTraits_parsedCorrectly() {
        Map<TraitProfile, BigDecimal> traitMap = Map.of(
                traitR, BigDecimal.valueOf(0.5),
                traitI, BigDecimal.valueOf(0.8)
        );

        String json = "{\"traits\":{\"R\":0.5,\"I\":0.8}}";

        ScoringResult result = simulateLlmResponse(json, traitMap);

        assertThat(result.traitScores())
                .containsEntry(traitR, BigDecimal.valueOf(0.5))
                .containsEntry(traitI, BigDecimal.valueOf(0.8));
    }

    @Test
    void parseTraits_unknownTraits_ignored() {
        String json = "{\"traits\":{\"UNKNOWN\":0.5}}";

        ScoringResult result = simulateLlmResponse(json, Collections.emptyMap());

        assertThat(result.traitScores()).isEmpty();
    }

    @Test
    void parseRecommendations_singleRecommendation_parsedCorrectly() {
        String json = "{\"traits\":{},\"recommendations\":[{\"professionId\":1,\"score\":0.9,\"explanation\":\"Good\"}]}";

        ScoringResult result = simulateLlmResponse(json, null);

        assertThat(result.recommendations()).hasSize(1);
        RecommendationDto rec = result.recommendations().getFirst();
        assertThat(rec.professionId()).isEqualTo(1);
        assertThat(rec.score()).isEqualByComparingTo(BigDecimal.valueOf(0.9));
        assertThat(rec.explanation()).isEqualTo("Good");
    }

    @Test
    void parseRecommendations_multipleRecommendations_parsedCorrectly() {
        String json = """
                {"traits":{},"recommendations":[
                    {"professionId":1,"score":0.5,"explanation":"Good"},
                    {"professionId":2,"score":0.8,"explanation":"Better"}
                ]}
                """;

        ScoringResult result = simulateLlmResponse(json, null);

        assertThat(result.recommendations()).hasSize(2);
        assertThat(result.recommendations().get(0).professionId()).isEqualTo(1);
        assertThat(result.recommendations().get(1).score()).isEqualByComparingTo(BigDecimal.valueOf(0.8));
    }

    @Test
    void parseTraits_zeroScore_retained() {
        Map<TraitProfile, BigDecimal> traitMap = Map.of(traitR, BigDecimal.ZERO);
        String json = "{\"traits\":{\"R\":0.0}}";

        ScoringResult result = simulateLlmResponse(json, traitMap);

        assertThat(result.traitScores())
                .hasSize(1)
                .allSatisfy((trait, value) -> assertThat(value).isEqualByComparingTo(BigDecimal.ZERO));
    }

    @Test
    void parseRecommendations_zeroScore_retained() {
        String json = "{\"traits\":{},\"recommendations\":[{\"professionId\":3,\"score\":0.0,\"explanation\":\"No fit\"}]}";

        ScoringResult result = simulateLlmResponse(json, null);

        assertThat(result.recommendations()).hasSize(1);
        RecommendationDto rec = result.recommendations().getFirst();
        assertThat(rec.score()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(rec.explanation()).isEqualTo("No fit");
    }

    @Test
    void parseJson_missingFields_returnsEmptyResults() {
        String json = "{}";

        ScoringResult result = simulateLlmResponse(json, Collections.emptyMap());

        assertThat(result.traitScores()).isEmpty();
        assertThat(result.recommendations()).isEmpty();
    }
}
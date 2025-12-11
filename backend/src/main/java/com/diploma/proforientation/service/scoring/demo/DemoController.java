package com.diploma.proforientation.service.scoring.demo;

import com.diploma.proforientation.service.scoring.ScoringResult;
import com.diploma.proforientation.service.scoring.llm.LlmScoringEngineImpl;
import com.diploma.proforientation.service.scoring.ml.impl.MlScoringEngineImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/demo")
@RequiredArgsConstructor
public class DemoController {

    private final MlScoringEngineImpl mlEngine;
    private final LlmScoringEngineImpl llmEngine;

    @PostMapping("/ml")
    public ScoringResult testMl(@RequestBody DemoRequest req) {
        return mlEngine.evaluateRaw(req.answers());
    }

    @PostMapping("/llm")
    public ScoringResult testLlm(@RequestBody DemoRequest req) {
        return llmEngine.evaluateRaw(req.answers());
    }
}

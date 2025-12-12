package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.request.AddAnswerRequest;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.service.AttemptService;
import com.diploma.proforientation.util.AuthUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final AttemptService attemptService;
    private final AuthUtils authUtils;

    @PostMapping("/start")
    public AttemptStartResponse startAttempt(@RequestParam Integer quizVersionId) {

        Integer userId = authUtils.getAuthenticatedUserId();

        return attemptService.startAttempt(quizVersionId, userId);
    }

    @PostMapping("/{attemptId}/answers")
    public void addAnswer(@PathVariable Integer attemptId,
                          @RequestBody AddAnswerRequest req) {
        attemptService.addAnswer(attemptId, req.optionId());
    }

    @PostMapping("/{attemptId}/submit")
    public AttemptResultDto submit(@PathVariable Integer attemptId) {
        return attemptService.submitAttempt(attemptId);
    }

    @GetMapping
    public List<AttemptSummaryDto> myAttempts(
            @RequestParam(required = false) String guestToken
    ) {
        Integer userId = authUtils.getAuthenticatedUserId();

        return attemptService.getMyAttempts(userId, guestToken);
    }

    @GetMapping("/{id}/result")
    public AttemptResultDto getResult(@PathVariable Integer id) {
        return attemptService.getResult(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AttemptSummaryDto> search(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer quizId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to
    ) {
        return attemptService.adminSearchAttempts(userId, quizId, from, to);
    }
}
package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.AttemptResultDto;
import com.diploma.proforientation.dto.AttemptSummaryDto;
import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.request.AddAnswerRequest;
import com.diploma.proforientation.dto.request.AddAnswersBulkRequest;
import com.diploma.proforientation.dto.response.AttemptStartResponse;
import com.diploma.proforientation.service.AttemptService;
import com.diploma.proforientation.util.AuthUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
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
    @Operation(
            summary = "Start a quiz attempt",
            description = """
                    Starts a new quiz attempt for a given quiz version.
                    
                    - If the user is authenticated, the attempt is linked to the user
                    - If the user is anonymous, a guest token is generated and returned
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Attempt successfully started",
            content = @Content(schema = @Schema(implementation = AttemptStartResponse.class))
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid quiz version",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    public AttemptStartResponse startAttempt(@RequestParam Integer quizVersionId) {

        Integer userId = authUtils.getAuthenticatedUserId();

        return attemptService.startAttempt(quizVersionId, userId);
    }

    @PostMapping("/{attemptId}/answers")
    @Operation(
            summary = "Submit a single answer",
            description = "Adds a single answer to an active attempt."
    )
    @ApiResponse(responseCode = "200", description = "Answer added successfully")
    @ApiResponse(
            responseCode = "400",
            description = "Attempt already submitted or invalid option",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    public void addAnswer(@PathVariable Integer attemptId,
                          @RequestBody AddAnswerRequest req) {
        attemptService.addAnswer(attemptId, req.optionId());
    }

    @PostMapping("/{attemptId}/answers/bulk")
    @Operation(
            summary = "Submit multiple answers at once",
            description = "Adds multiple answers to an active attempt in a single request."
    )
    @ApiResponse(responseCode = "200", description = "Answers added successfully")
    @ApiResponse(
            responseCode = "400",
            description = "Invalid request or attempt state",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    public void addAnswersBulk(
            @PathVariable Integer attemptId,
            @RequestBody AddAnswersBulkRequest request
    ) {
        attemptService.addAnswersBulk(attemptId, request.optionIds());
    }

    @PostMapping("/{attemptId}/submit")
    @Operation(
            summary = "Submit attempt",
            description = """
                    Finalizes an attempt and triggers scoring logic.
                    
                    - Calculates trait scores
                    - Calls external ML service
                    - Produces profession recommendations
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Attempt successfully submitted and scored",
            content = @Content(schema = @Schema(implementation = AttemptResultDto.class))
    )
    @ApiResponse(
            responseCode = "400",
            description = "Attempt already submitted or incomplete",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    public AttemptResultDto submit(@PathVariable Integer attemptId) {
        return attemptService.submitAttempt(attemptId);
    }

    @GetMapping
    @Operation(
            summary = "Get user's attempts",
            description = """
                    Returns all attempts for the current user.
                    
                    - Authenticated users: attempts linked to user account
                    - Guest users: attempts linked via guest token
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "List of attempt summaries",
            content = @Content(schema = @Schema(implementation = AttemptSummaryDto.class))
    )
    public List<AttemptSummaryDto> myAttempts(
            @RequestParam(required = false) String guestToken
    ) {
        Integer userId = authUtils.getAuthenticatedUserId();
        String locale = LocaleContextHolder.getLocale().getLanguage();

        return attemptService.getMyAttempts(userId, guestToken, locale);
    }

    @GetMapping("/{id}/result")
    @Operation(
            summary = "Get attempt result",
            description = "Returns final scoring results and recommendations for a submitted attempt."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Attempt result",
            content = @Content(schema = @Schema(implementation = AttemptResultDto.class))
    )
    @ApiResponse(
            responseCode = "404",
            description = "Attempt not found",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    public AttemptResultDto getResult(@PathVariable Integer id) {
        return attemptService.getResult(id);
    }

    @GetMapping("/search")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Admin search attempts",
            description = """
                    Administrative search over attempts.
                    
                    Supports filtering by:
                    - user
                    - quiz
                    - date range
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Filtered list of attempts",
            content = @Content(schema = @Schema(implementation = AttemptSummaryDto.class))
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class))
    )
    public List<AttemptSummaryDto> search(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer quizId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to
    ) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return attemptService.adminSearchAttempts(userId, quizId, from, to, locale);
    }
}
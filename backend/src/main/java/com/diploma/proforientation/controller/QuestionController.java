package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.service.QuestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a question",
            description = "Creates a new question for a quiz version. Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Question successfully created",
            content = @Content(schema = @Schema(implementation = QuestionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public QuestionDto create(@Valid @RequestBody CreateQuestionRequest req) {
        return questionService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update a question",
            description = "Updates question text, type, or order. Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Question updated",
            content = @Content(schema = @Schema(implementation = QuestionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Question not found")
    public QuestionDto update(@PathVariable Integer id,
                              @Valid @RequestBody UpdateQuestionRequest req) {
        return questionService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete a question",
            description = "Deletes a question by ID. Only administrators are allowed."
    )
    @ApiResponse(responseCode = "200", description = "Question deleted")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Question not found")
    public void delete(@PathVariable Integer id) {
        questionService.delete(id);
    }

    @PutMapping("/{id}/order/{ord}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update question order",
            description = "Changes the display order of a question within a quiz version."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Order updated",
            content = @Content(schema = @Schema(implementation = QuestionDto.class))
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Question not found")
    public QuestionDto updateOrder(@PathVariable Integer id,
                                   @PathVariable Integer ord) {
        return questionService.updateOrder(id, ord);
    }

    @GetMapping("/quiz/{quizId}")
    @Operation(
            summary = "Get questions for current quiz version (paginated)",
            description = """
                Returns questions for the current published version of a quiz.

                Pagination parameters:
                - `page` (0-based index, default: 0)
                - `size` (page size, default: 20)
                - `sort` (sorting field, default: ord)

                Example:
                `/questions/quiz/5?page=0&size=10&sort=ord,asc`
                """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Page of questions",
            content = @Content(schema = @Schema(implementation = QuestionDto.class))
    )
    public Page<QuestionDto> getQuestionsForQuiz(
            @PathVariable Integer quizId,
            @RequestParam(defaultValue = "en") String locale,
            @PageableDefault(size = 20, sort = "ord") Pageable pageable
    ) {
        return questionService.getQuestionsForCurrentVersion(quizId, locale, pageable);
    }

    @GetMapping("/quiz/{quizId}/version/{version}")
    @Operation(
            summary = "Get questions for a specific quiz version (paginated)",
            description = """
                Returns questions for a specific quiz version.

                Pagination parameters:
                - `page` (0-based index)
                - `size` (page size)
                - `sort` (sorting field)

                Example:
                `/questions/quiz/5/version/2?page=1&size=10`
                """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Page of questions",
            content = @Content(schema = @Schema(implementation = QuestionDto.class))
    )
    @ApiResponse(responseCode = "404", description = "Quiz version not found")
    public Page<QuestionDto> getQuestionsForQuizVersion(
            @PathVariable Integer quizId,
            @PathVariable Integer version,
            @RequestParam(defaultValue = "en") String locale,
            @PageableDefault(size = 20, sort = "ord") Pageable pageable
    ) {
        return questionService.getQuestionsForVersion(quizId, version, locale, pageable);
    }
}
package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuestionDto;
import com.diploma.proforientation.dto.request.create.CreateQuestionRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuestionRequest;
import com.diploma.proforientation.service.QuestionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public QuestionDto create(@Valid @RequestBody CreateQuestionRequest req) {
        return questionService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public QuestionDto update(@PathVariable Integer id,
                              @Valid @RequestBody UpdateQuestionRequest req) {
        return questionService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        questionService.delete(id);
    }

    @PutMapping("/{id}/order/{ord}")
    @PreAuthorize("hasRole('ADMIN')")
    public QuestionDto updateOrder(@PathVariable Integer id,
                                   @PathVariable Integer ord) {
        return questionService.updateOrder(id, ord);
    }

    @GetMapping("/quiz/{quizId}")
    public List<QuestionDto> getQuestionsForQuiz(
            @PathVariable Integer quizId,
            @RequestParam(defaultValue = "en") String locale
    ) {
        return questionService.getQuestionsForCurrentVersion(quizId, locale);
    }

    @GetMapping("/quiz/{quizId}/version/{version}")
    public List<QuestionDto> getQuestionsForQuizVersion(
            @PathVariable Integer quizId,
            @PathVariable Integer version,
            @RequestParam(defaultValue = "en") String locale
    ) {
        return questionService.getQuestionsForVersion(quizId, version, locale);
    }
}
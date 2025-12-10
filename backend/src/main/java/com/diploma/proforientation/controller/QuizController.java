package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.service.QuizVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final QuizVersionService versionService;

    @GetMapping
    public List<QuizDto> getAll() {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return quizService.getAllLocalized(locale);
    }

    @GetMapping("/{id}")
    public QuizDto getById(@PathVariable Integer id) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return quizService.getByIdLocalized(id, locale);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public QuizDto create(@RequestBody CreateQuizRequest req) {
        return quizService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public QuizDto update(@PathVariable Integer id,
                          @RequestBody UpdateQuizRequest req) {
        return quizService.update(id, req);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public QuizVersionDto publish(@PathVariable Integer id) {
        return versionService.publishQuiz(id);
    }

    @PostMapping("/{id}/copy")
    @PreAuthorize("hasRole('ADMIN')")
    public QuizVersionDto copyLatest(@PathVariable Integer id) {
        return versionService.copyLatestVersion(id);
    }
}
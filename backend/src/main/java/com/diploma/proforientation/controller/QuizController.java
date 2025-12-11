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

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        quizService.delete(id);
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

    @GetMapping("/{id}/versions")
    public List<QuizVersionDto> getVersions(@PathVariable Integer id) {
        return versionService.getVersionsForQuiz(id);
    }

    @GetMapping("/{id}/versions/current")
    public QuizVersionDto getCurrentVersion(@PathVariable Integer id) {
        return versionService.getCurrentVersion(id);
    }

    @GetMapping("/{id}/versions/{version}")
    public QuizVersionDto getVersion(
            @PathVariable Integer id,
            @PathVariable Integer version
    ) {
        return versionService.getVersion(id, version);
    }
}
package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.service.ProfessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/professions")
@RequiredArgsConstructor
public class ProfessionController {

    private final ProfessionService service;

    @GetMapping
    public List<ProfessionDto> getAll() {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return service.getAllLocalized(locale);
    }

    @GetMapping("/{id}")
    public ProfessionDto getById(@PathVariable Integer id) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return service.getByIdLocalized(id, locale);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionDto create(@RequestBody CreateProfessionRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProfessionDto update(@PathVariable Integer id, @RequestBody CreateProfessionRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
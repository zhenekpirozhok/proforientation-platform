package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;
import com.diploma.proforientation.service.TraitService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/traits")
@RequiredArgsConstructor
public class TraitController {

    private final TraitService service;

    @GetMapping
    public List<TraitDto> getAll() {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return service.getAllLocalized(locale);
    }

    @GetMapping("/{id}")
    public TraitDto getById(@PathVariable Integer id) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return service.getByIdLocalized(id, locale);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public TraitDto create(@RequestBody CreateTraitRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TraitDto update(@PathVariable Integer id,
                           @RequestBody CreateTraitRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
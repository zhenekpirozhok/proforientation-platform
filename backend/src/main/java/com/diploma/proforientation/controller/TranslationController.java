package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;
import com.diploma.proforientation.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/translations")
@RequiredArgsConstructor
public class TranslationController {

    private final TranslationService service;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public TranslationDto create(@RequestBody CreateTranslationRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public TranslationDto update(@PathVariable Integer id,
                                 @RequestBody UpdateTranslationRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }

    @GetMapping
    public List<TranslationDto> search(
            @RequestParam String entityType,
            @RequestParam Integer entityId,
            @RequestParam String locale
    ) {
        return service.search(entityType, entityId, locale);
    }
}

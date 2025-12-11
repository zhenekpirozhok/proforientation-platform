package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.service.OptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/options")
@RequiredArgsConstructor
public class OptionController {

    private final OptionService optionService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public OptionDto create(@RequestBody CreateOptionRequest req) {
        return optionService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public OptionDto update(@PathVariable Integer id,
                            @RequestBody UpdateOptionRequest req) {
        return optionService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Integer id) {
        optionService.delete(id);
    }

    @PutMapping("/{id}/order/{ord}")
    @PreAuthorize("hasRole('ADMIN')")
    public OptionDto updateOrder(@PathVariable Integer id,
                                 @PathVariable Integer ord) {
        return optionService.updateOrder(id, ord);
    }

    @GetMapping("/question/{questionId}")
    public List<OptionDto> getByQuestion(
            @PathVariable Integer questionId
    ) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return optionService.getByQuestionLocalized(questionId, locale);
    }

}
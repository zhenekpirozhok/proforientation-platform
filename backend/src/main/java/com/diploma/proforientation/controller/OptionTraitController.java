package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.request.OptionTraitListRequest;
import com.diploma.proforientation.service.OptionTraitService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/options")
@RequiredArgsConstructor
public class OptionTraitController {

    private final OptionTraitService service;

    @PostMapping("/{optionId}/traits")
    @PreAuthorize("hasRole('ADMIN')")
    public void assignTraits(@PathVariable Integer optionId,
                             @RequestBody OptionTraitListRequest req) {
        service.assignTraits(optionId, req.traits());
    }

    @PutMapping("/{optionId}/traits")
    @PreAuthorize("hasRole('ADMIN')")
    public void updateTraits(@PathVariable Integer optionId,
                             @RequestBody OptionTraitListRequest req) {
        service.updateTraits(optionId, req.traits());
    }
}
package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.request.OptionTraitListRequest;
import com.diploma.proforientation.service.OptionTraitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/options")
@RequiredArgsConstructor
@Tag(name = "Option Trait", description = "Assign/Update traits operations")
public class OptionTraitController {

    private final OptionTraitService service;

    @PostMapping("/{optionId}/traits")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Assign traits to an option",
            description = """
                Assigns a list of traits with weights to a specific option.
                Existing trait assignments (if any) will be replaced.
                Accessible only to administrators.
                """
    )
    @ApiResponse(responseCode = "200", description = "Traits successfully assigned")
    @ApiResponse(responseCode = "400", description = "Invalid request payload")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Option not found")
    public void assignTraits(@PathVariable Integer optionId,
                             @RequestBody OptionTraitListRequest req) {
        service.assignTraits(optionId, req.traits());
    }

    @PutMapping("/{optionId}/traits")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update traits for an option",
            description = """
                Updates the list of traits associated with a specific option.
                Traits not present in the request will be removed.
                Accessible only to administrators.
                """
    )
    @ApiResponse(responseCode = "200", description = "Traits successfully updated")
    @ApiResponse(responseCode = "400", description = "Invalid request payload")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Option not found")
    public void updateTraits(@PathVariable Integer optionId,
                             @RequestBody OptionTraitListRequest req) {
        service.updateTraits(optionId, req.traits());
    }
}
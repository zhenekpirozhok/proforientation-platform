package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ProfessionDto;
import com.diploma.proforientation.dto.request.create.CreateProfessionRequest;
import com.diploma.proforientation.service.ProfessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/professions")
@RequiredArgsConstructor
public class ProfessionController {

    private final ProfessionService service;

    @GetMapping
    @Operation(
            summary = "Get all professions (paginated)",
            description = """
                Returns a paginated list of professions with localized fields.

                Pagination parameters:
                - `page` (0-based index, default: 0)
                - `size` (page size, default: 20)
                - `sort` (sorting field, default: id)

                Example:
                `/professions?page=0&size=10&sort=id,asc`
                """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Page of professions",
            content = @Content(schema = @Schema(implementation = ProfessionDto.class))
    )
    public Page<ProfessionDto> getAll(
            @PageableDefault(size = 20, sort = "id") Pageable pageable
    ) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return service.getAllLocalized(locale, pageable);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get profession by ID",
            description = "Returns a single profession by its ID with localized fields."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Profession found",
            content = @Content(schema = @Schema(implementation = ProfessionDto.class))
    )
    @ApiResponse(responseCode = "404", description = "Profession not found")
    public ProfessionDto getById(@PathVariable Integer id) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return service.getByIdLocalized(id, locale);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a profession",
            description = "Creates a new profession. Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Profession created",
            content = @Content(schema = @Schema(implementation = ProfessionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public ProfessionDto create(@RequestBody CreateProfessionRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update a profession",
            description = "Updates an existing profession. Only administrators are allowed."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Profession updated",
            content = @Content(schema = @Schema(implementation = ProfessionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Profession not found")
    public ProfessionDto update(@PathVariable Integer id, @RequestBody CreateProfessionRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete a profession",
            description = "Deletes a profession by ID. Only administrators are allowed."
    )
    @ApiResponse(responseCode = "200", description = "Profession deleted")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Profession not found")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
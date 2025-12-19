package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ProfessionCategoryDto;
import com.diploma.proforientation.dto.request.create.CreateCategoryRequest;
import com.diploma.proforientation.service.ProfessionCategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
@RequiredArgsConstructor
public class ProfessionCategoryController {

    private final ProfessionCategoryService service;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get all profession categories",
            description = "Returns a list of all profession categories. Accessible only to administrators."
    )
    @ApiResponse(
            responseCode = "200",
            description = "List of profession categories",
            content = @Content(schema = @Schema(implementation = ProfessionCategoryDto.class))
    )
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public List<ProfessionCategoryDto> getAll() {
        return service.getAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create a profession category",
            description = "Creates a new profession category. Accessible only to administrators."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Category created",
            content = @Content(schema = @Schema(implementation = ProfessionCategoryDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public ProfessionCategoryDto create(@Valid @RequestBody CreateCategoryRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update a profession category",
            description = "Updates an existing profession category by ID. Accessible only to administrators."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Category updated",
            content = @Content(schema = @Schema(implementation = ProfessionCategoryDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Category not found")
    public ProfessionCategoryDto update(@PathVariable Integer id,
                                        @Valid @RequestBody CreateCategoryRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete a profession category",
            description = "Deletes a profession category by ID. Accessible only to administrators."
    )
    @ApiResponse(responseCode = "200", description = "Category deleted")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    @ApiResponse(responseCode = "404", description = "Category not found")
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
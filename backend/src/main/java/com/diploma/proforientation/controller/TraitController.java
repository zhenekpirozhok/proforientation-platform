package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateTraitRequest;
import com.diploma.proforientation.service.TraitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/traits")
@RequiredArgsConstructor
@Tag(name = "Trait", description = "CRUD operations for traits")
public class TraitController {

    private final TraitService service;

    @GetMapping
    @Operation(
            summary = "Get all traits",
            description = "Returns all traits localized according to the current request locale"
    )
    @ApiResponse(
            responseCode = "200",
            description = "List of traits",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TraitDto.class)
            )
    )
    public List<TraitDto> getAll() {
        return service.getAllLocalized();
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get trait by ID",
            description = "Returns a single trait localized according to the current request locale"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Trait found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TraitDto.class)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "Trait not found",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public TraitDto getById(@PathVariable Integer id) {
        return service.getByIdLocalized(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create trait",
            description = "Creates a new trait (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Trait created successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TraitDto.class)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (ADMIN role required)",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid request payload",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public TraitDto create(@RequestBody CreateTraitRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update trait",
            description = "Updates an existing trait (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Trait updated successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TraitDto.class)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (ADMIN role required)",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "Trait not found",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public TraitDto update(@PathVariable Integer id,
                           @RequestBody CreateTraitRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete trait",
            description = "Deletes a trait by its ID (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "204",
            description = "Trait deleted successfully"
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (ADMIN role required)",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }
}
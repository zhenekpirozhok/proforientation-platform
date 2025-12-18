package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.TranslationDto;
import com.diploma.proforientation.dto.request.create.CreateTranslationRequest;
import com.diploma.proforientation.dto.request.update.UpdateTranslationRequest;
import com.diploma.proforientation.service.TranslationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
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
    @Operation(
            summary = "Create translation",
            description = "Creates a new translation entry for a specific entity field and locale"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Translation created successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TranslationDto.class)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "Validation error",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class),
                    examples = @ExampleObject(value = """
                        {
                          "code": 400,
                          "time": "2025-05-20T15:00:00Z",
                          "message": {
                            "locale": "locale must be a valid language code (e.g., en, en-US)"
                          }
                        }
                    """)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (ADMIN role required)",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class)
            )
    )
    public TranslationDto create(@Valid @RequestBody CreateTranslationRequest req) {
        return service.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update translation",
            description = "Updates the text of an existing translation"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Translation updated successfully",
            content = @Content(
                    schema = @Schema(implementation = TranslationDto.class)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid request",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (ADMIN role required)",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class)
            )
    )
    public TranslationDto update(@PathVariable Integer id,
                                 @RequestBody UpdateTranslationRequest req) {
        return service.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete translation",
            description = "Deletes a translation by its identifier"
    )
    @ApiResponse(
            responseCode = "204",
            description = "Translation deleted successfully"
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (ADMIN role required)",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class)
            )
    )
    public void delete(@PathVariable Integer id) {
        service.delete(id);
    }

    @GetMapping
    @Operation(
            summary = "Search translations",
            description = "Returns translations for a given entity, entity ID, and locale"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Translations found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TranslationDto.class)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid request parameters",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class)
            )
    )
    public List<TranslationDto> search(
            @RequestParam String entityType,
            @RequestParam Integer entityId,
            @RequestParam String locale
    ) {
        return service.search(entityType, entityId, locale);
    }

    @GetMapping("/entity/{entityType}")
    @Operation(
            summary = "Get all translations for entity type",
            description = "Returns all translations for a given entity type across all locales"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Translations returned successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TranslationDto.class)
            )
    )
    public List<TranslationDto> getAllForEntityType(
            @PathVariable String entityType
    ) {
        return service.getAllForEntityType(entityType);
    }
}

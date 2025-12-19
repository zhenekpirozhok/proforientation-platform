package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.OptionDto;
import com.diploma.proforientation.dto.request.create.CreateOptionRequest;
import com.diploma.proforientation.dto.request.update.UpdateOptionRequest;
import com.diploma.proforientation.service.OptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
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
    @Operation(
            summary = "Create an answer option",
            description = """
                    Creates a new answer option for a question.
                    Only administrators are allowed to perform this operation.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Option successfully created",
            content = @Content(schema = @Schema(implementation = OptionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class)))
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public OptionDto create(@Valid @RequestBody CreateOptionRequest req) {
        return optionService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update an option",
            description = """
                    Updates an existing answer option.
                    Only administrators can modify options.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Option updated",
            content = @Content(schema = @Schema(implementation = OptionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Validation error",
            content = @Content(schema = @Schema(implementation = ExceptionDto.class)))
    @ApiResponse(responseCode = "404", description = "Option not found")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public OptionDto update(@PathVariable Integer id,
                            @Valid @RequestBody UpdateOptionRequest req) {
        return optionService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete an option",
            description = """
                    Deletes an answer option permanently.
                    This operation cannot be undone.
                    """
    )
    @ApiResponse(responseCode = "200", description = "Option deleted")
    @ApiResponse(responseCode = "404", description = "Option not found")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public void delete(@PathVariable Integer id) {
        optionService.delete(id);
    }

    @PutMapping("/{id}/order/{ord}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update option order",
            description = """
                    Updates the display order of an option within a question.
                    Order must be a non-negative integer.
                    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Option order updated",
            content = @Content(schema = @Schema(implementation = OptionDto.class))
    )
    @ApiResponse(responseCode = "400", description = "Invalid order value")
    @ApiResponse(responseCode = "404", description = "Option not found")
    @ApiResponse(responseCode = "403", description = "Forbidden")
    public OptionDto updateOrder(@PathVariable Integer id,
                                 @PathVariable Integer ord) {
        return optionService.updateOrder(id, ord);
    }
}
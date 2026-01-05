package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.service.QuizVersionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quiz", description = "CRUD operations for quizzes")
public class QuizController {

    private final QuizService quizService;
    private final QuizVersionService versionService;

    @GetMapping
    @Operation(
            summary = "Get all quizzes (paginated)",
            description = """
                Returns a paginated list of quizzes localized according to the current request locale.

                Pagination is supported via standard Spring Data parameters:
                - `page` (default: 1)
                - `size` (number of items per page, default: 20)
                - `sort` (sorting criteria, e.g. `id,asc` or `title,desc`)

                Example:
                `/quizzes?page=0&size=10&sort=title,asc`
                """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Page of quizzes",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizDto.class)
            )
    )
    public Page<QuizDto> getAll(
            @Parameter(description = "Page number (0-based)", schema = @Schema(defaultValue = "1"))
            @RequestParam(required = false, defaultValue = "1") int page,
            @Parameter(description = "Number of items per page", schema = @Schema(defaultValue = "20"))
            @RequestParam(required = false, defaultValue = "20") int size,
            @Parameter(description = "Sort by field", schema = @Schema(defaultValue = "id"))
            @RequestParam(required = false, defaultValue = "id") String sort
    ) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));
        return quizService.getAllLocalized(locale, pageable);
    }

    @GetMapping("/{id}")
    @Operation(
            summary = "Get quiz by ID",
            description = "Returns a single quiz localized according to the current request locale"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizDto.class)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "Quiz not found",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public QuizDto getById(@PathVariable Integer id) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return quizService.getByIdLocalized(id, locale);
    }

    @GetMapping("/code/{code}")
    @Operation(
            summary = "Get quiz by code",
            description = "Returns a single quiz localized according to the current request locale"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizDto.class)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "Quiz not found",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public QuizDto getByCode(@PathVariable String code) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        return quizService.getByCodeLocalized(code, locale);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create quiz",
            description = "Creates a new quiz (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz created",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizDto.class)
            )
    )
    @ApiResponse(
            responseCode = "400",
            description = "Invalid request payload",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public QuizDto create(@RequestBody CreateQuizRequest req) {
        return quizService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Update quiz",
            description = "Updates an existing quiz (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz updated",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizDto.class)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "Quiz not found",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public QuizDto update(@PathVariable Integer id,
                          @RequestBody UpdateQuizRequest req) {
        return quizService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Delete quiz",
            description = "Deletes a quiz by its ID (ADMIN only)"
    )
    @ApiResponse(responseCode = "204", description = "Quiz deleted")
    @ApiResponse(
            responseCode = "403",
            description = "Access denied",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public void delete(@PathVariable Integer id) {
        quizService.delete(id);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Publish quiz",
            description = "Publishes a quiz and creates a new current quiz version (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz published",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
            )
    )
    public QuizVersionDto publish(@PathVariable Integer id) {
        return versionService.publishQuiz(id);
    }

    @PostMapping("/{id}/copy")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Copy latest quiz version",
            description = "Creates a new draft version by copying the latest version (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz version copied",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
            )
    )
    public QuizVersionDto copyLatest(@PathVariable Integer id) {
        return versionService.copyLatestVersion(id);
    }

    @GetMapping("/{id}/versions")
    @Operation(
            summary = "Get quiz versions",
            description = "Returns all versions of a quiz"
    )
    @ApiResponse(
            responseCode = "200",
            description = "List of quiz versions",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
            )
    )
    public List<QuizVersionDto> getVersions(@PathVariable Integer id) {
        return versionService.getVersionsForQuiz(id);
    }

    @GetMapping("/{id}/versions/current")
    @Operation(
            summary = "Get current quiz version",
            description = "Returns the currently published quiz version"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Current quiz version",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
            )
    )
    public QuizVersionDto getCurrentVersion(@PathVariable Integer id) {
        return versionService.getCurrentVersion(id);
    }

    @GetMapping("/{id}/versions/{version}")
    @Operation(
            summary = "Get specific quiz version",
            description = "Returns a specific version of a quiz by version number"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz version found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "Quiz version not found",
            content = @Content(
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public QuizVersionDto getVersion(
            @PathVariable Integer id,
            @PathVariable Integer version
    ) {
        return versionService.getVersion(id, version);
    }

    @GetMapping("/search")
    @Operation(
            summary = "Search and sort quizzes",
            description = "Search quizzes by title, code, or description and sort by category or creation/update time. Supports pagination and localization."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quizzes found",
            content = @Content(
                    mediaType = "application/json",
                    array = @ArraySchema(schema = @Schema(implementation = QuizDto.class))
            )
    )
    @ApiResponse(
            responseCode = "404",
            description = "No quizzes found",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = com.diploma.proforientation.dto.ExceptionDto.class)
            )
    )
    public Page<QuizDto> searchQuizzes(
            @RequestParam(required = false) String search,
            @RequestParam(required = false, defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        String locale = LocaleContextHolder.getLocale().getLanguage();
        Pageable pageable = PageRequest.of(page - 1, size);
        return quizService.searchAndSort(search, sortBy, locale, pageable);
    }
}
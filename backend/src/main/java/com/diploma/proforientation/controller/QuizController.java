package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.QuizDto;
import com.diploma.proforientation.dto.QuizVersionDto;
import com.diploma.proforientation.dto.TraitDto;
import com.diploma.proforientation.dto.request.create.CreateQuizRequest;
import com.diploma.proforientation.dto.request.update.UpdateQuizRequest;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.QuizService;
import com.diploma.proforientation.service.QuizVersionService;
import com.diploma.proforientation.service.TraitService;
import com.diploma.proforientation.util.rate.RateLimit;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/quizzes")
@RequiredArgsConstructor
@Tag(name = "Quiz", description = "CRUD operations for quizzes")
public class QuizController {

    private final QuizService quizService;
    private final QuizVersionService versionService;
    private final TraitService traitService;

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
    @RateLimit(requests = 30, durationSeconds = 60)
    public Page<QuizDto> getAll(
            @Parameter(description = "Page number", schema = @Schema(defaultValue = "1"))
            @RequestParam(required = false, defaultValue = "1") int page,
            @Parameter(description = "Number of items per page", schema = @Schema(defaultValue = "20"))
            @RequestParam(required = false, defaultValue = "20") int size,
            @Parameter(description = "Sort by field", schema = @Schema(defaultValue = "id"))
            @RequestParam(required = false, defaultValue = "id") String sort
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));
        return quizService.getAllLocalized(pageable);
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
    @RateLimit(requests = 30, durationSeconds = 60)
    public QuizDto getById(@PathVariable Integer id) {
        return quizService.getByIdLocalized(id);
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
    @RateLimit(requests = 30, durationSeconds = 60)
    public QuizDto getByCode(@PathVariable String code) {
        return quizService.getByCodeLocalized(code);
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
    public QuizDto create(@RequestBody CreateQuizRequest req,
                          @AuthenticationPrincipal User user) {

        return quizService.create(req, user.getId());
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
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Integer id) {
        quizService.delete(id);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get quizzes created by the current admin",
            description = "Returns all quizzes (published or draft) created by the currently authenticated admin"
    )
    @ApiResponse(
            responseCode = "200",
            description = "List of quizzes by author",
            content = @Content(
                    mediaType = "application/json",
                    array = @ArraySchema(schema = @Schema(implementation = QuizDto.class))
            )
    )
    public Page<QuizDto> getMyQuizzes(
            @AuthenticationPrincipal User user,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int size,
            @RequestParam(required = false, defaultValue = "id") String sort
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));
        return quizService.getByAuthor(user.getId(), pageable);
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Publish quiz",
            description = "Enter quiz_version_id to publish it and corresponding quiz (ADMIN only)"
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
        return versionService.publishQuizVersion(id);
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
            summary = "Search and filter quizzes",
            description = "Search quizzes by title, code, or description and filter by category or duration time. Supports pagination and localization."
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
    public Page<QuizDto> search(
            @Parameter(
                    description = "Search text (title, code or description)",
                    example = "career"
            )
            @RequestParam(required = false)
            String search,
            @Parameter(
                    description = "Profession category ID",
                    example = "1"
            )
            @RequestParam(required = false)
            Integer categoryId,

            @Parameter(
                    description = "Minimum estimated duration in seconds",
                    example = "300"
            )
            @RequestParam(required = false)
            Integer minDurationSec,

            @Parameter(
                    description = "Maximum estimated duration in seconds",
                    example = "1200"
            )
            @RequestParam(required = false)
            Integer maxDurationSec,
            @Parameter(description = "Page number", schema = @Schema(defaultValue = "1"))
            @RequestParam(required = false, defaultValue = "1") int page,
            @Parameter(description = "Number of items per page", schema = @Schema(defaultValue = "20"))
            @RequestParam(required = false, defaultValue = "20") int size,
            @Parameter(description = "Sort by field", schema = @Schema(defaultValue = "id"))
            @RequestParam(required = false, defaultValue = "id") String sort
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));
        return quizService.search(search, categoryId, minDurationSec, maxDurationSec, pageable);
    }

    @PostMapping("/{id}/versions")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Create new quiz version",
            description = "Creates a new draft version for the quiz. The version is not published automatically. (ADMIN only)"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz version created",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
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
    public QuizVersionDto createVersion(@PathVariable Integer id) {
        return versionService.createDraftVersion(id);
    }

    @GetMapping("/{quizVersionId}/traits")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get traits for a quiz",
            description = "Returns all traits (scales) used in a specific quiz or quiz version. " +
                    "The traits are collected from all options of the quiz questions."
    )
    @ApiResponse(
            responseCode = "200",
            description = "List of traits returned successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = TraitDto.class)
            )
    )
    @ApiResponse(responseCode = "403", description = "Access forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz or quiz version not found")
    public List<TraitDto> getTraits(@PathVariable Integer quizVersionId) {
        return traitService.getTraitsForQuizVersion(quizVersionId);
    }

    @GetMapping("/version/{quizVersionId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get quiz version by id",
            description = "Returns detailed information about a specific quiz version using its unique identifier. " +
                    "This endpoint is typically used to resolve a quiz version id to its version number."
    )
    @ApiResponse(
            responseCode = "200",
            description = "Quiz version returned successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = QuizVersionDto.class)
            )
    )
    @ApiResponse(responseCode = "403", description = "Access forbidden")
    @ApiResponse(responseCode = "404", description = "Quiz version not found")
    public QuizVersionDto getVersionById(@PathVariable Integer quizVersionId) {
        return versionService.getVersionById(quizVersionId);
    }
}
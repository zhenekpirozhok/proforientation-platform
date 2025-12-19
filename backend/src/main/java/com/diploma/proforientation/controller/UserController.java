package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.dto.UserDto;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RequestMapping("/users")
@RestController
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('USER')")
    @Operation(
            summary = "Get current authenticated user",
            description = "Returns the profile of the currently authenticated user"
    )
    @ApiResponse(
            responseCode = "200",
            description = "Authenticated user returned successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = User.class)
            )
    )
    @ApiResponse(
            responseCode = "401",
            description = "User is not authenticated",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class),
                    examples = @ExampleObject(value = """
                        {
                          "code": 401,
                          "time": "2025-05-20T14:50:00Z",
                          "message": "Unauthorized"
                        }
                    """)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Authenticated but insufficient permissions",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class),
                    examples = @ExampleObject(value = """
                        {
                          "code": 403,
                          "time": "2025-05-20T14:50:10Z",
                          "message": "Access denied: insufficient permissions"
                        }
                    """)
            )
    )
    public ResponseEntity<UserDto> authenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(
                new UserDto(
                        user.getId(),
                        user.getEmail(),
                        user.getDisplayName(),
                        user.getRole().name()
                )
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(
            summary = "Get all users (admin only)",
            description = """
        Returns a paginated list of users.

        Pagination parameters:
        - page: page number (0-based)
        - size: page size
        - sort: sorting criteria (e.g. id,asc)
    """
    )
    @ApiResponse(
            responseCode = "200",
            description = "Users retrieved successfully",
            content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = Page.class)
            )
    )
    @ApiResponse(
            responseCode = "403",
            description = "Access denied (admin role required)",
            content = @Content(
                    schema = @Schema(implementation = ExceptionDto.class),
                    examples = @ExampleObject(value = """
                        {
                          "code": 403,
                          "time": "2025-05-20T14:52:00Z",
                          "message": "Access denied: insufficient permissions"
                        }
                    """)
            )
    )
    public ResponseEntity<Page<UserDto>> allUsers(
            @Parameter(description = "Page number (0-based)", schema = @Schema(defaultValue = "1"))
            @RequestParam(required = false, defaultValue = "1") int page,
            @Parameter(description = "Number of items per page", schema = @Schema(defaultValue = "20"))
            @RequestParam(required = false, defaultValue = "20") int size,
            @Parameter(description = "Sort by field", schema = @Schema(defaultValue = "id"))
            @RequestParam(required = false, defaultValue = "id") String sort
    ) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by(sort));
        Page<UserDto> users = userService.getAllUsers(pageable)
                .map(user -> new UserDto(
                        user.getId(),
                        user.getEmail(),
                        user.getDisplayName(),
                        user.getRole().name()
                ));

        return ResponseEntity.ok(users);
    }
}
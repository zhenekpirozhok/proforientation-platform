package com.diploma.proforientation.controller;

import com.diploma.proforientation.dto.ExceptionDto;
import com.diploma.proforientation.model.User;
import com.diploma.proforientation.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
    public ResponseEntity<User> authenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        return ResponseEntity.ok(currentUser);
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
    public ResponseEntity<Page<User>> allUsers(
            @PageableDefault(size = 20, sort = "id") Pageable pageable
    ) {
        Page<User> users = userService.getAllUsers(pageable);
        return ResponseEntity.ok(users);
    }
}
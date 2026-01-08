# Error Handling Request-Response Lifecycle

![error-handling-lifecycle.png](../assets/error-handling-lifecycle.png)

Errors are handled centrally to ensure consistent API responses.

- Exception occurs at any layer
- Global exception handler intercepts it
- Error is mapped to a structured response
- Client receives standardized error format
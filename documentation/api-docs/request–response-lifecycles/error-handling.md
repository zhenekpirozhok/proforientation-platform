# Error Handling Request-Response Lifecycle

![Screenshot 2025-12-19 at 13.26.29.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_qkYjfz/Screenshot%202025-12-19%20at%2013.26.29.png)

Errors are handled centrally to ensure consistent API responses.

- Exception occurs at any layer
- Global exception handler intercepts it
- Error is mapped to a structured response
- Client receives standardized error format
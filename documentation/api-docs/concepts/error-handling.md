# Error Handling

This document describes the standardized error-handling strategy used across the
ProfOrientation API. All endpoints return errors in a **consistent, predictable format**
to simplify client-side handling and debugging.

---

## 1. Standard Error Response Format

All API errors follow the same JSON structure:

```json
{
  "code": 400,
  "time": "2025-05-20T14:50:10Z",
  "message": "Human-readable error description"
}
```

Field Description
| Field   | Type             | Description                                                     |
|---------|-----------------|-----------------------------------------------------------------|
| code    | integer          | HTTP status code                                                |
| time    | string (ISO-8601)| Timestamp when the error occurred                               |
| message | string or object | Error description or structured validation errors

##  2. Validation Errors (400 Bad Request)
Validation errors occur when request payloads violate validation constraints
(e.g., missing fields, invalid formats).

Example
```json
{
  "code": 400,
  "time": "2025-05-20T14:52:00Z",
  "message": {
    "email": "Invalid email format",
    "password": "Password must contain at least one number"
  }
}
```

Client Recommendations
Display field-level error messages

Do not retry automatically

Validate inputs client-side when possible

## 3. Authentication & Authorization Errors
**401 Unauthorized**
Returned when:

- No authentication token is provided
- Token is invalid or expired

```json
{
  "code": 401,
  "time": "2025-05-20T14:55:00Z",
  "message": "Unauthorized"
}
```
**403 Forbidden**
Returned when:

User is authenticated but lacks required permissions

```json
{
  "code": 403,
  "time": "2025-05-20T14:56:10Z",
  "message": "Access denied: insufficient permissions"
}
```

## 4. Resource Not Found (404)
Returned when a requested resource does not exist.

```json
{
  "code": 404,
  "time": "2025-05-20T15:00:00Z",
  "message": "Quiz not found"
}
```

## 5. Business Logic Errors
Business rule violations return HTTP 400 or 409 depending on the context.

Examples include:

- Submitting an already completed attempt
- Invalid state transitions
- Domain-specific constraints

```json
{
  "code": 400,
  "time": "2025-05-20T15:05:00Z",
  "message": "Attempt already submitted"
}
```

## 6. Internal Server Errors (500)
Returned when an unexpected system error occurs.

```json
{
  "code": 500,
  "time": "2025-05-20T15:10:00Z",
  "message": "An unexpected error occurred"
}
```
⚠️ Internal implementation details are intentionally hidden for security reasons.

## 7. Error Taxonomy Summary
| HTTP Status | Category                             |
|-------------|--------------------------------------|
| 400         | Validation / business rule violation |
| 401         | Authentication error                 |
| 403         | Authorization error                  |
| 404         | Resource not found                   |
| 500         | Internal server error                |

## 8. Best Practices for API Consumers

- Always check HTTP status codes
- Parse error responses using the standard schema
- Handle validation errors explicitly
- Refresh tokens on 401 responses
- Log timestamps and error messages for debugging
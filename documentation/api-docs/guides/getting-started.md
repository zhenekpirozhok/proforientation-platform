# Getting Started with Proforientation API

This guide helps you make your **first successful API request in under 5 minutes**.

It is intended for developers who want to quickly verify access and understand
the basic API workflow.

---

## Prerequisites

- Running backend (local or deployed)
- HTTP client (curl, Postman, Insomnia)
- Valid user account

---

## Step 1: Authenticate

```http
POST /api/v1.0/auth/login
Content-Type: application/json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Response

```http
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "refreshToken": "...",
  "expiresIn": 3600000
}
```
Save the token.
Go to the Authorize button above.
![Screenshot 2025-12-19 at 11.06.58.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_Qu6gha/Screenshot%202025-12-19%20at%2011.06.58.png)
Enter the token and click "Authorize".
![Screenshot 2025-12-19 at 11.07.48.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_mYArCu/Screenshot%202025-12-19%20at%2011.07.48.png)

## Step 2: Call a protected endpoint

```http
GET /api/v1.0/quizzes
Authorization: Bearer <token>
```

## Step 3: Explore API Reference

- Swagger UI: /api/v1.0/ui.html
- OpenAPI spec: docs/openapi.yaml
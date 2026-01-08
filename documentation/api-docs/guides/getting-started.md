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
![authorize.png](../assets/authorize.png)
Enter the token and click "Authorize".
![enter_token.png](../assets/enter_token.png)

## Step 2: Call a protected endpoint

```http
GET /api/v1.0/quizzes
Authorization: Bearer <token>
```

## Step 3: Explore API Reference

- Swagger UI: /api/v1.0/ui.html
- OpenAPI spec: docs/openapi.yaml
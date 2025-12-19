# Developer Onboarding Guide

Welcome to the **ProfOrientation API**  
This guide walks new developers through the complete onboarding process — from
first request to a working integration.

---

## 1. Who This Guide Is For

This guide is intended for:
- Frontend developers integrating the API
- Backend developers consuming quiz results
- Data scientists validating scoring outputs
- QA engineers testing API flows

No prior knowledge of the system is required.

---

## 2. Prerequisites

Before starting, make sure you have:

- HTTP client (Postman, Insomnia, curl)
- Basic REST API knowledge
- JSON familiarity
- Access to the API base URL

---

## 3. API Base URL

http://localhost:8080/api/v1.0

All endpoints in this guide are relative to this base URL.

---

## 4. First Contact — Health Check

Verify that the API is running.

GET /actuator/health/readiness

Expected response:
```json
{
  "status": "UP"
}
```

---

## 5. Create Your First User
Step 1 — Register
POST /auth/signup

```json
{
"email": "developer@example.com",
"displayName": "Dev User",
"password": "password1"
}
```

---

## 6. Authenticate and Obtain Tokens
Step 2 — Login
POST /auth/login
```json
{
"email": "developer@example.com",
"password": "password1",
"rememberMe": true
}
```

All authenticated requests must include the access token.

- Save the tokens you received after login.
- Go to the Authorize button above.
  ![Screenshot 2025-12-19 at 11.06.58.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_Qu6gha/Screenshot%202025-12-19%20at%2011.06.58.png)
- Enter the jwt token and click "Authorize".
  ![Screenshot 2025-12-19 at 11.07.48.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_mYArCu/Screenshot%202025-12-19%20at%2011.07.48.png)

---

## 7. Typical User Flow — Taking a Quiz
Step 3 — List Available Quizzes
GET /quizzes

Step 4 — Start an Attempt
POST /attempts/start?quizVersionId=1

Response:
```json
{
"attemptId": 42,
"guestToken": null
}
```

---

## 8. Answer Questions
Add a Single Answer
POST /attempts/42/answers
```json
{
"optionId": 100
}
```

Add Answers in Bulk
POST /attempts/42/answers/bulk
```json
{
"optionIds": [
  1,6,11,16,21,26,31,36,
  41,46,51,56,61,66,71,76,
  81,86,91,96,101,106,111,116,
  121,126,131,136,141,146,151,156,
  161,166,171,176,181,186,191,196,
  201,206,211,216,221,226,231,236
]
}
```

---

## 9. Submit the Attempt
POST /attempts/42/submit

Response:
```json
{
"traitScores": [
{ "traitCode": "R", "score": 12.5 },
{ "traitCode": "I", "score": 9.0 }
],
"recommendations": [
{
"professionId": 42,
"score": 0.82,
"explanation": "Predicted as: Software Engineer"
}
]
}
```

---

## 10. Handling Errors During Onboarding
If something goes wrong, all errors follow a unified format:
```json
{
"code": 400,
"time": "2025-05-20T15:00:00Z",
"message": "Validation failed"
}
```

Common onboarding errors:

- 401 — missing or invalid token
- 403 — insufficient permissions
- 404 — resource not found

---

## 11. Admin Onboarding 

Admin users can:

- Create quizzes
- Manage questions and options
- Configure professions and traits
- View all attempts

Admin-only endpoints are clearly marked in API docs.

---

## 12. Where to Go Next

Once onboarded, continue with:

- authentication.md — security deep dive
- pagination.md — handling large datasets
- error-handling.md — error taxonomy
- versioning.md — API evolution rules

---

## 13. Design Principles Behind the API

- Stateless architecture
- Predictable REST conventions
- Strong typing via OpenAPI
- Consistent error structure
- Clear role separation
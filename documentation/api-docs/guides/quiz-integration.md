# Step-by-Step Integration Tutorial: Quiz Attempt Flow

This tutorial demonstrates how to integrate the **ProfOrientation API**
into a client application by implementing a complete quiz flow:

**Authenticate → Load quiz → Answer questions → Submit → Read results**

---

## 1. What You Will Build

By the end of this tutorial, you will be able to:

- Authenticate a user
- Fetch available quizzes
- Start a quiz attempt
- Submit answers
- Retrieve and display scoring results

This mirrors a **real production integration**.

---

## 2. Prerequisites

- API running locally or remotely
- Valid API base URL
- HTTP client (Postman, curl, or frontend app)
- Basic REST and JSON knowledge

---

## 3. API Base URL

http://localhost:8080/api/v1.0


---

## 4. Step 1 — Authenticate the User

### Login
POST /auth/login
```json
{
  "email": "user@example.com",
  "password": "password1",
  "rememberMe": false
}
```
Response:
```json
{
  "token": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 3600000
}
```
Save the token — it will be used in all subsequent requests.

---

## 5. Step 2 — Fetch Available Quizzes
   GET /quizzes?page=0&size=10
   Authorization: Bearer <access_token>


Response (simplified):
```json
{
"content": [
{
"id": 1,
"code": "RIASEC",
"title": "Career Orientation Test",
"processingMode": "ML"
}
]
}
```

Choose a quiz ID for the next step.

---

## 6. Step 3 — Get Current Quiz Version
   GET /quizzes/1/versions/current


Response:
```json
{
"id": 5,
"quizId": 1,
"version": 3,
"isCurrent": true
}
```

---

## 7. Step 4 — Start an Attempt
   POST /attempts/start?quizVersionId=5
   Authorization: Bearer <access_token>


Response:
```json
{
"attemptId": 42,
"guestToken": null
}
```

Save attemptId.

---

## 8. Step 5 — Load Questions
   GET /questions/quiz/1?page=0&size=20


Response:
```json
{
"content": [
{
"id": 100,
"text": "I enjoy solving technical problems",
"qtype": "liker_scale_5",
"options": [
{ "id": 500, "ord": 1, "label": "Strongly disagree" },
{ "id": 501, "ord": 2, "label": "Disagree" },
{ "id": 502, "ord": 3, "label": "Neutral" }
]
}
]
}
```

---

## 9. Step 6 — Submit Answers (Bulk)

Collect selected option IDs from the UI.

POST /attempts/42/answers/bulk
Authorization: Bearer <access_token>
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

## 10. Step 7 — Submit Attempt
    POST /attempts/42/submit
    Authorization: Bearer <access_token>


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

## 11. Step 8 — Display Results
Example UI Logic

- Sort recommendations by score
- Show top 3 professions
- Visualize trait scores (radar / bar chart)

---

## 12. Error Handling During Integration

Common errors:

| Status | Cause                          |
|--------|--------------------------------|
| 400    | Invalid request / validation   |
| 401    | Missing or expired token       |
| 403    | Role restriction               |
| 404    | Quiz or attempt not found      |

All errors use the same structure:
```json
{
"code": 403,
"time": "2025-05-20T14:50:10Z",
"message": "Access denied: insufficient permissions"
}
```

---

## 13. Guest User Integration (Optional)

If the user is unauthenticated:

- guestToken is returned
- Must be stored client-side
- Used to retrieve attempts later

---

## 14. Best Practices

✔ Use bulk answer submission
✔ Handle pagination properly
✔ Cache quiz metadata
✔ Refresh tokens before expiry
✔ Never expose tokens in URLs

--- 

## 15. Summary

This tutorial demonstrated a full real-world integration flow:

✔ Authentication
✔ Quiz discovery
✔ Attempt lifecycle
✔ Answer submission
✔ Result interpretation

---
## 16. Next Steps

- Explore /professions endpoint for career details
- Implement localization using Accept-Language
- Add admin tooling for quiz management
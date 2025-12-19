# Request Flow Diagram — Quiz Attempt & Scoring

This diagram illustrates the end-to-end request flow when a user submits a quiz attempt
and receives career recommendations.

![Screenshot 2025-12-19 at 12.48.31.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_pUiOJ6/Screenshot%202025-12-19%20at%2012.48.31.png)

## Flow Explanation
### 1. Client Request

The client submits a completed quiz attempt using:

POST /attempts/{attemptId}/submit

Guests and authenticated users are both supported.

### 2. Security Layer

- JWT authentication is validated (if present)
- Role checks are applied where required
- Guest attempts bypass authentication

### 3. Attempt Processing

The backend:

- Loads the attempt and associated answers
- Ensures the attempt has not already been submitted
- Selects the appropriate scoring engine

### 4. Scoring Engine

Depending on quiz configuration:

- ML-based scoring → external ML service
- LLM / rule-based scoring → internal engine

Both produce:

- Trait scores
- Ranked profession recommendations

### 5. Persistence

Results are saved for:

- Result retrieval
- Analytics
- Admin reporting

### 6. Response

The API returns a structured response:
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
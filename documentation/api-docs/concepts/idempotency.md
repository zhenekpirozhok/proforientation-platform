# Idempotency

## Idempotent Endpoints

- GET
- PUT
- DELETE

Calling them multiple times yields the same result.

## Non-idempotent Endpoints

- POST /attempts/start
- POST /answers

These create new resources or state transitions.

## Best Practice

Clients should avoid retries on non-idempotent endpoints unless explicitly supported.
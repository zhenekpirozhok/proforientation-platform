# Authentication Sequence Diagrams

This document describes authentication-related request flows, including
standard login and token refresh.

---

## User Login (Email & Password)

![sequence-authentication.png](../../assets/sequence-authentication.png)

## Refresh Token Flow

![refresh-token-flow.png](../../assets/refresh-token-flow.png)

## Failure Scenarios

- Invalid credentials → 401 Unauthorized
- Expired refresh token → 401 Unauthorized
- Missing token → 403 Forbidden
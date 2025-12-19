# Authentication Sequence Diagrams

This document describes authentication-related request flows, including
standard login and token refresh.

---

## User Login (Email & Password)

![Screenshot 2025-12-19 at 13.02.18.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_cNSYWg/Screenshot%202025-12-19%20at%2013.02.18.png)

## Refresh Token Flow

![Screenshot 2025-12-19 at 13.01.33.png](../../../../../../../var/folders/6b/3q8v8r2x31ldf94c9g2phby40000gn/T/TemporaryItems/NSIRD_screencaptureui_aaUFRi/Screenshot%202025-12-19%20at%2013.01.33.png)

## Failure Scenarios

- Invalid credentials → 401 Unauthorized
- Expired refresh token → 401 Unauthorized
- Missing token → 403 Forbidden
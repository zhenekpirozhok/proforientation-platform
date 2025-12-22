# Frontend Architecture & Documentation

## 1. Overview

The frontend of the career orientation platform is implemented as a Single Page Application (SPA) based on **Next.js (App Router)**.  
The application follows a **Backend For Frontend (BFF)** architectural pattern and communicates with the backend via a strictly typed API generated from an **OpenAPI specification**.

The system supports:
- guest quiz completion flow,
- multilingual user interface (RU / EN),
- scalable and maintainable modular architecture.

---

## 2. Frontend Architecture Diagram

### 2.1 High-Level Interaction Flow

```

Browser (UI)
↓
Entities / Features (domain logic)
↓
Generated API (Orval + React Query)
↓
orvalFetch (HTTP → /api/*)
↓
Next.js BFF (Route Handlers)
↓
Backend API (Java, OpenAPI)

```

### 2.2 Main Modules

- `app/` — routing, layouts, and pages (thin layer).
- `entities/` — domain-level logic (quiz, attempt).
- `features/` — business processes (e.g. quiz-player flow).
- `shared/` — shared utilities, UI components, API infrastructure.
- `shared/api/generated/` — auto-generated OpenAPI client code.

---

## 3. Architectural Approach

### 3.1 Component-Based Architecture
The frontend follows a component-based React architecture:
- UI is composed of independent reusable components.
- Pages do not contain business logic.
- Business logic is encapsulated in `entities` and `features`.

### 3.2 Backend For Frontend (BFF)
The frontend **never communicates directly with the backend API**.  
All browser requests are routed through Next.js API routes (`/api/*`).

Benefits:
- no CORS issues,
- centralized handling of headers, cookies, and locale,
- backend URL isolation from the client,
- easy future integration of authentication and authorization.

### 3.3 State Management Strategy
State is explicitly separated by responsibility:

- **Server State**  
  Managed with **TanStack Query (React Query)**:
  - data fetching,
  - caching,
  - loading and error handling.

- **Client (UI) State**  
  Used for interactive flows such as quiz completion:
  - current question index,
  - selected answers,
  - progress tracking.

  For complex flows, a lightweight store (Zustand) is planned.

---

## 4. API Documentation (Client Perspective)

### 4.1 API Contract Source
The backend API contract is defined using OpenAPI:

```

documentation/api-docs/reference/openapi.yaml

```

### 4.2 API Client Generation
The following tools are used:
- `openapi-typescript` — schema type generation,
- `orval` — API methods and React Query hooks generation.

Generated code location:
```

frontend/src/shared/api/generated/

```

Generated files are not edited manually.

### 4.3 Example API Endpoints

#### Get list of quizzes
```

GET /quizzes?page=0&size=20

````

Response example:
```json
{
  "content": [
    { "id": 1, "title": "Career Orientation Test" }
  ],
  "totalElements": 10
}
````

#### Start quiz attempt

```
POST /attempts/start
```

Request body:

```json
{
  "quizVersionId": 5
}
```

Response:

```json
{
  "attemptId": 123
}
```

---

## 5. User Flows / Navigation Diagram

### 5.1 Guest Quiz Completion Flow

```
/quizzes
   ↓
/quizzes/:id          (quiz description)
/quizzes/:id/start    (quiz completion)
/results/:attemptId   (quiz results)
```

### 5.2 Flow Description

1. The user opens the quiz catalog.
2. The user selects a quiz and views its description.
3. The user starts the quiz.
4. The user answers the questions sequentially.
5. The user submits the quiz and views the result.

---

## 6. Localization

### 6.1 UI Localization

* Implemented using `next-intl`.
* Locale is determined by the URL segment (`/ru`, `/en`).

### 6.2 Content Localization

* Quiz content is localized on the backend.
* The BFF forwards the locale via the `Accept-Language` header.
* If a translation is missing, a fallback (default locale) is used.

---

## 7. Technology Stack Justification

### Next.js (React)

* Modern App Router architecture.
* Built-in API routes enabling BFF pattern.
* Good performance and scalability.

### TypeScript

* Strong type safety.
* Seamless integration with OpenAPI-generated types.
* Reduced runtime errors.

### TanStack Query (React Query)

* Efficient server-state management.
* Automatic caching and background refetching.
* Clear separation between server and client state.

### OpenAPI + Orval

* Single source of truth for API contracts.
* Fully typed client and hooks generation.
* Eliminates manual API integration errors.

### Zustand 

* Minimal boilerplate.
* Suitable for managing complex client-side flows.
* Works well alongside React Query.


# Modules & Resources Overview

This document describes the main application modules, their responsibilities,
and how API resources map to internal services and domain models.

The system follows a **layered, modular architecture** designed for clarity,
testability, and extensibility.

---

## High-Level Architecture

The backend is structured into the following layers:

- **Controller Layer** — HTTP API, validation, security boundaries
- **Service Layer** — business logic and orchestration
- **Domain Layer** — entities and enums
- **Persistence Layer** — repositories and database access
- **Integration Layer** — ML and LLM scoring services

Each API resource corresponds to a dedicated service module.

---

## Authentication & User Management

### Controllers
- `AuthenticationController`
- `UserController`

### Responsibilities
- User registration and login
- JWT access & refresh token handling
- Google One Tap authentication
- Account deletion
- User profile retrieval

### Core Resources
- `/auth/signup`
- `/auth/login`
- `/auth/refresh`
- `/auth/request-password-reset`
- `/auth/reset-password`
- `/users/me`
- `/users`

### Security Model
- JWT-based stateless authentication
- Role-based authorization (`USER`, `ADMIN`)
- Guests supported for quiz attempts

---

## Quiz Management

### Controllers
- `QuizController`
- `QuizVersionController`

### Responsibilities
- Quiz lifecycle management
- Versioning and publishing
- Localization support
- Administrative operations

### Core Resources
- `/quizzes`
- `/quizzes/{id}`
- `/quizzes/{id}/publish`
- `/quizzes/{id}/versions`

### Key Concepts
- A **Quiz** represents a logical test
- A **QuizVersion** represents a published snapshot
- Only one version can be active at a time

---

## Question & Option Management

### Controllers
- `QuestionController`
- `OptionController`

### Responsibilities
- Question creation and ordering
- Option management
- Localization of text and labels
- Pagination for large quizzes

### Core Resources
- `/questions`
- `/questions/quiz/{quizId}`
- `/options`
- `/options/{id}`

### Domain Rules
- Questions belong to a quiz version
- Options belong to a question
- Ordering (`ord`) defines display sequence

---

## Attempt & Scoring Module

### Controller
- `AttemptController`

### Responsibilities
- Starting quiz attempts
- Capturing user answers
- Submitting attempts
- Returning results and recommendations

### Core Resources
- `/attempts/start`
- `/attempts/{id}/answers`
- `/attempts/{id}/submit`
- `/attempts/{id}/result`

### Special Features
- Guest and authenticated flows
- Immutable submitted attempts
- Stored scoring results

---

## Scoring & ML Integration

### Services
- `ScoringEngineFactory`
- `MlScoringEngineImpl`
- `LlmScoringEngineImpl`

### Responsibilities
- Selecting scoring strategy
- Normalizing user answers
- Integrating with external ML service
- Mapping predictions to professions

### Integration Points
- External ML service (`/predict`)
- Internal rule-based and LLM engines

### Design Rationale
- Strategy pattern enables extensibility
- External services are isolated and mockable
- Supports future scoring algorithms

---

## Profession & Trait Management

### Controllers
- `ProfessionController`
- `TraitController`
- `ProfessionCategoryController`

### Responsibilities
- Managing professions and categories
- Trait definitions and scoring dimensions
- Mapping ML predictions to domain entities

### Core Resources
- `/professions`
- `/categories`
- `/traits`

---

## Localization & Translation

### Controller
- `TranslationController`

### Responsibilities
- Managing localized content
- Resolving translations at runtime
- Fallback to default values

### Core Resources
- `/translations`
- `/translations/entity/{entityType}`

### Supported Entities
- Quizzes
- Questions
- Options
- Professions
- Traits

---

## Administrative Utilities

### Controllers
- `OptionTraitController`

### Responsibilities
- Assigning traits to options
- Weight configuration for scoring
- Fine-tuning recommendation logic

### Core Resources
- `/options/{optionId}/traits`

---

## Error Handling & Validation

### Global Component
- `AdvisorController`

### Responsibilities
- Centralized exception handling
- Consistent error response format
- Validation error aggregation

### Error Response Structure
```json
{
  "code": 400,
  "time": "2025-01-01T12:00:00Z",
  "message": "Validation failed"
}
```
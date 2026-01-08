# Component Diagram

This diagram provides a high-level view of the system architecture,
illustrating the main components, their responsibilities, and interactions.

The system follows a layered architecture:
- API Layer (Controllers)
- Application Layer (Services)
- Domain Layer (Entities)
- Infrastructure Layer (Repositories, External Systems)

---

## System Component Diagram

![component-diagram.png](../assets/component-diagram.png)

## Component Responsibilities
API Layer

- Handles HTTP requests
- Performs validation and authorization
- Returns DTO-based responses

Application Services

- Encapsulate business logic
- Orchestrate workflows
- Enforce domain rules

Domain Model

- Core business entities
- Persistence-agnostic 

Infrastructure

- Database access
- JWT handling
- External communication

External Systems

- Machine Learning prediction engine
- LLM-based explanation provider
- Email delivery service

## Architectural Highlights

- Layered architecture improves maintainability
- Pluggable scoring engines enable extensibility
- DTO boundaries prevent entity leakage
- External integrations isolated from core logic
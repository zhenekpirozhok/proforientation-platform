# CI/CD Pipeline Report (GitHub Actions)

## 1. Overview

This report describes the CI/CD pipelines implemented in the project using **GitHub Actions**.
The pipelines automate code quality checks, testing, artifact generation, containerization, database migrations, and deployment.

The solution demonstrates engineering culture, automation, and DevOps best practices as required by the assignment .

---

## 2. CI/CD Tool

**Tool:** GitHub Actions

GitHub Actions is used as the CI/CD platform because it:

* Is natively integrated with GitHub
* Uses declarative YAML configuration
* Supports multiple workflows per repository
* Provides secure secret storage
* Supports Docker, caching, artifacts, and manual triggers

All pipelines are defined in `.github/workflows/*.yml`.

---

## 3. High-Level CI/CD Diagram

```text
Push / Pull Request / Manual Trigger
               │
               ▼
        GitHub Actions
               │
   ┌───────────┼─────────────────────┐
   │           │                     │
Backend CI   Frontend CI        DB Migration CI
   │           │                     │
Build       Lint / Test          Flyway validate
Test        Build                Flyway migrate
Docker      Docker               Validate post-migrate
Deploy
```

Main flow:

**Build → Tests → Artifacts → Docker → Deployment**

---

## 4. Pipelines Overview

The repository contains **four independent CI/CD pipelines**, each responsible for a specific part of the system.

| Pipeline      | File                    | Purpose                                          |
| ------------- | ----------------------- | ------------------------------------------------ |
| Backend CI/CD | `backend.yml`           | Build, test, security scan, Docker image, deploy |
| Frontend CI   | `frontend.yml`          | Lint, test, build, Docker image                  |
| Database CI   | `db.yml`                | Validate and apply DB migrations                 |
| Contract CI   | `contract-frontend.yml` | Generate API types from OpenAPI                  |

---

## 5. Backend CI/CD Pipeline

**Workflow:** `backend.yml` 

### Triggers

* `push` to `main`
* `pull_request`
* `workflow_dispatch`

### CI Stages

#### 1. Code Quality

* Checkstyle
* PMD
* Detection of commented-out code

#### 2. Build

* Maven Wrapper (`./mvnw verify`)
* Java 21 (Temurin)
* Dependency caching (Maven cache)

#### 3. Testing

* Mandatory unit tests (JUnit)
* Test results published as GitHub Checks
* Test reports uploaded as artifacts

#### 4. Coverage Quality Gate

* JaCoCo coverage report
* Minimum coverage threshold: **80%**
* Pipeline fails if threshold is not met

#### 5. Smoke Test

* Application started from built JAR
* Health check via HTTP
* Automatic OpenAPI export

#### 6. Security

* Trivy filesystem scan
* Trivy Docker image scan
* Build blocked on HIGH / CRITICAL vulnerabilities

### Artifacts

* Unit test reports
* Coverage report
* Smoke test logs
* OpenAPI specification

---

### CD (Backend Deployment)

**Deployment type:** Docker Compose on self-hosted EC2 server 

Steps:

1. Build Docker image
2. Push image to GitHub Container Registry (GHCR)
3. Deploy via SSH using Docker Compose
4. Run health check after deployment
5. Rollback implicitly prevented by failing pipeline on errors

Secrets are stored in **GitHub Secrets**:

* SSH keys
* EC2 credentials
* Health check URL

---

## 6. Frontend CI Pipeline

**Workflow:** `frontend.yml` 

### Triggers

* `push` to `main`
* `pull_request`
* `workflow_dispatch`

### CI Stages

1. **Formatting**

   * Prettier format check

2. **Security**

   * `npm audit` (HIGH severity)
   * Trivy filesystem scan

3. **Lint**

   * ESLint

4. **Testing**

   * Unit tests (if present)

5. **Build**

   * Next.js production build

6. **Docker**

   * Docker image build
   * Push to GHCR (main branch only)

### Artifacts

* Frontend production build
* Docker image

---

## 7. Database CI Pipeline

**Workflow:** `db.yml` 

### Purpose

Automated validation and execution of database migrations.

### CI Stages

1. Start PostgreSQL service container
2. Validate migration files presence
3. Flyway validate (pre-migration)
4. Flyway migrate
5. Flyway validate (post-migration)
6. Upload Flyway logs as artifacts

### Security

* Database credentials stored in GitHub Secrets
* No credentials stored in repository

---

## 8. Contract → Frontend Pipeline

**Workflow:** `contract-frontend.yml` 

### Purpose

Synchronize backend API contract with frontend code.

### Steps

1. Validate OpenAPI specification
2. Generate frontend API types
3. Detect changes in generated files
4. Automatically create or update a Pull Request if changes exist

This ensures **contract consistency** between backend and frontend.

---

## 9. Environments

| Environment | Description                           |
| ----------- | ------------------------------------- |
| Dev         | Local development                     |
| Test        | CI pipelines (GitHub Actions runners) |
| Production  | EC2 server with Docker Compose        |

Even though environments are partially emulated, they are clearly separated and documented .

---

## 10. Error Handling and Quality

* Pipeline fails on:

  * Build errors
  * Test failures
  * Coverage below threshold
  * Security vulnerabilities
* Deployment is blocked if CI fails
* Logs and summaries are published in GitHub Actions UI

---

## 11. Security Practices

* All secrets stored in **GitHub Secrets**
* No secrets committed to code or YAML
* Security scanning:

  * `npm audit`
  * Trivy filesystem scan
  * Trivy Docker image scan

# DEVELOPMENT_RULES

Документ фиксирует инженерные правила для Frontend части профориентационной платформы.
Цель: единая архитектура, предсказуемость кода, минимизация регрессий, быстрый onboarding.

---

## 1) Технологический стек

- **Next.js (App Router)** — основной фреймворк.
- **TypeScript** — везде, без `any` (допускается временно в точечных местах с TODO).
- **OpenAPI → генерация типов и клиента**
  - `openapi-typescript` → типы схемы
  - `orval` → типизированные методы + React Query hooks
- **TanStack Query (React Query)** — server-state (кеш, loading, ошибки, рефетч).
- **next-intl** — UI i18n (тексты интерфейса).
- **BFF в Next** — все браузерные запросы идут **только** в `/api/*`.

---

## 2) OpenAPI: генерация и дисциплина

### 2.1 Источник схемы
OpenAPI схема лежит в репозитории:
`documentation/api-docs/reference/openapi.yaml`

### 2.2 Скрипты генерации
Единая точка входа — `gen:api`.

Пример:
- `gen:api:types` — обновляет `schema.d.ts`
- `gen:api:client` — генерирует Orval client/hooks
- `gen:api` — запускает оба

> В CI используется `npm run gen:api`. Не менять контракт с CI.

### 2.3 Generated-код
Папка: `frontend/src/shared/api/generated/**`

Правила:
- **НЕ редактировать** вручную содержимое `generated/**`.
- Любые улучшения — через `orval.config.ts` или слой-обёртки в `entities/*/api`.

---

## 3) BFF: обязательная прокси-архитектура

### 3.1 Правило
Frontend (браузер) не обращается напрямую к backend URL.
Все запросы из UI выполняются на `/api/*` (Next.js route handlers).

### 3.2 Где живёт BFF
- Route handlers: `frontend/src/app/api/**/route.ts`
- Общие helper’ы BFF: `frontend/src/shared/api/bff/*`

### 3.3 Backend URL
Переменная окружения (server-only):
- `BACKEND_URL`

Примеры:
- локально: `http://localhost:8080`
- прод: `https://api.example.com`

**Важно**
- Не использовать `NEXT_PUBLIC_BACKEND_URL`.
- Значения окружения в проде задаются хостингом или через GitHub Actions/Secrets в процессе деплоя.

---

## 4) Локализация

### 4.1 UI i18n
- Используем `next-intl`.
- Строки интерфейса — только через словари (`messages/*.json`).
- URL содержит locale: `/ru/...`, `/en/...`.

### 4.2 Контент (локализация данных от backend)
Backend локализует данные по `Accept-Language`.
BFF прокидывает локаль из заголовка `x-locale` → `accept-language`.

Принцип:
- UI/Orval запросы должны отправлять `x-locale`.
- BFF гарантирует `accept-language` на upstream.

Если английских переводов в БД нет — backend возвращает fallback (обычно RU). Это корректно.

---

## 5) Архитектура модулей

Проект делится на слои:

- `app/` — роутинг, layout’ы, страницы (тонкие).
- `features/` — фичи/процессы (например quiz-player).
- `entities/` — доменные сущности (quiz, attempt, user).
- `shared/` — переиспользуемые утилиты, ui-kit, api инфраструктура.

Правило:
- Страницы не должны содержать бизнес-логику.
- Страницы вызывают `features`/`entities`, а не `generated` напрямую.

---

## 6) Доступ к API: как работать с Orval

### 6.1 “Generated” не импортируется в UI
UI не должен импортировать `shared/api/generated/api.ts` напрямую.

Правильно:
- `entities/quiz/api/useQuizzes.ts` оборачивает `useGetAll1(...)`
- UI использует `useQuizzes(...)`

### 6.2 Обёртки для читабельности
Причина: сгенерённые имена могут быть несемантичны (`useGetAll1`, `getAll1`).
Мы прячем их за доменными именами:
- `useQuizzes`
- `useQuiz`
- `useCurrentQuizVersion`
- `useStartAttempt`
- `useSubmitAttempt`
- `useAttemptResult`

---

## 7) State management

### 7.1 Server state
Используем React Query (через Orval hooks). Это основной state management для данных с сервера.

### 7.2 Client/UI state
Для процессов (например прохождение квиза) допускается и рекомендуется локальный state management:
- Zustand (предпочтительно) или `useReducer` внутри feature

Где нужен клиентский state:
- текущий шаг квиза
- ответы пользователя
- валидация шага
- прогресс прохождения
- логика “Next disabled until answered”

---

## 8) Ошибки, loading, пустые состояния

- Любой запрос должен иметь UI для:
  - loading
  - error
  - empty state (если применимо)
- Route handlers BFF должны корректно возвращать статус backend (не “съедать” ошибки).

---

## 9) Качество кода

### 9.1 TypeScript
- `any` запрещён. Временный `any` допускается только с комментариями `// TODO: type`.

### 9.2 Форматирование
- Prettier обязателен.
- Generated-вывод форматируется (CI может переформатировать).

### 9.3 Имена
- Доменные названия: `useQuizzes`, `useQuiz`, `QuizDetailsPage`.
- Не тянуть `useGetAll1` в UI.

---

## 10) Тестирование (минимальный стандарт)

- Unit/Integration: тесты на ключевую логику (quiz-player reducer/store, валидация, UI состояния).
- E2E (по возможности): базовый guest flow “open quiz → answer → submit → results”.

---

## 11) GitHub Actions (контракты)

В репозитории настроен workflow, который:
- проверяет наличие `documentation/api-docs/reference/openapi.yaml`
- запускает `npm ci` в `frontend`
- запускает `npm run gen:api`
- форматирует `frontend/src/shared/api/generated/**`
- создаёт PR при изменениях generated

Правило:
- `gen:api` — стабильное имя скрипта
- generated файлы не править руками, только через генерацию

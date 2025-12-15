# Frontend Development Rules (Next.js + BFF + i18n + JWT)

Дата: 2025-12-15  
Проект: Career Path Platform (public SEO + /me + /admin)  
Frontend: Next.js (App Router) + TypeScript  
Backend: отдельно (Java) + JWT (access/refresh)

---

## 1) Цели архитектуры

1. **SEO и шаринг** для публичной части (лендинг/каталог/страницы квизов).
2. **BFF (Backend-for-Frontend)**: браузер общается только с Next.js `/api/*`, Next проксирует в Java.
3. **Безопасная авторизация**: refresh в httpOnly cookies, access короткий.
4. **RBAC**: user / admin / superadmin.
5. **Обязательная мультиязычность** (RU/EN) для UI и SEO.
6. **Тестируемость**: покрываем юнит-тестами критическую логику (auth, quiz-player, api-клиент).

---

## 2) Технологии

- **Next.js** (App Router), **TypeScript**
- UI: допускается AntD или свой `shared/ui`.
- State:
  - серверные данные: **TanStack Query** *или* **RTK Query** (выбрать один и придерживаться)
  - локальный UI-state: React state / Zustand (по необходимости)
- Валидация форм: Zod / Yup (выбрать один).
- i18n: **next-intl** (рекомендуется) или next-i18next (выбрать один).
- Тесты: **Jest + React Testing Library**, моки: **MSW**
- Форматирование/качество:
  - ESLint + Prettier
  - Husky + lint-staged (pre-commit)
  - TypeScript strict = true

---

## 3) Роли и доступы (RBAC)

Роли:
- **superadmin**: управление квизами + управление пользователями
- **admin**: управление квизами
- **user**: прохождение, личный кабинет

Правила:
- **Backend — источник правды** по авторизации/ролям.
- Frontend:
  - прячет/показывает элементы UI по ролям (удобство),
  - но **не** считается “защитой” (защита всегда на API).

Маршруты:
- Public: `/`, `/quizzes`, `/quizzes/[slug]`
- User: `/me/**`
- Admin: `/admin/**`
  - супер-админские разделы: `/admin/users/**` (или отдельный layout)

---

## 4) i18n (обязательная)

### 4.1 Языковые маршруты
Используем префикс локали в URL:
- `/ru/...`
- `/en/...`

Требования:
- Локаль по умолчанию: настраивается (например, `ru`).
- `hreflang` и canonical формируются корректно (важно для SEO).

### 4.2 Переводы
- Все пользовательские строки — только через i18n словари.
- Ключи переводов стабильные, без «склейки» строк.
- Словари: `messages/ru.json`, `messages/en.json` (или аналогично).

---

## 5) BFF (Next `/api/*` → Java backend)

### 5.1 Принцип
Браузер **не вызывает Java API напрямую**.  
Все запросы идут в:
- `GET/POST /api/...` (Next Route Handlers)

А Next уже вызывает backend по `JAVA_API_URL`.

### 5.2 Причины
- меньше CORS проблем,
- безопаснее для токенов,
- удобнее SSR/Server Components,
- единый контроль ошибок и трейсинга.

### 5.3 Единый API клиент (server-side)
Создаём `shared/lib/serverApi.ts`:
- добавляет access token (из cookies),
- при 401 → делает refresh → повторяет запрос 1 раз,
- логирует ошибки (без утечек токенов).

**Нельзя**:
- хранить токены в `localStorage` (XSS риск),
- прокидывать refresh token в клиентский JS.

---

## 6) JWT, cookies и обновление токена

Рекомендуемая схема:
- **access token**: короткий (5–15 минут)
- **refresh token**: длинный (7–30 дней)
- хранение: **httpOnly Secure cookies**

Cookies (пример):
- `access_token` (httpOnly, Secure, SameSite=Lax, Path=/)
- `refresh_token` (httpOnly, Secure, SameSite=Lax, Path=/api/auth или /)

BFF endpoints:
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

Правила:
- refresh вызывается только сервером (Route Handler / serverApi).
- при logout очищаем обе cookies.

---

## 7) SEO: обязательный минимум

### 7.1 Рендеринг
- Ленд/каталог: SSG + `revalidate` (ISR) где уместно.
- Детали квиза: SSR или SSG (зависит от объёма и частоты обновлений).

### 7.2 Метаданные
На страницах каталога и квиза:
- `generateMetadata()` (title, description, OpenGraph, twitter)
- canonical
- `robots` (index/follow там, где нужно)

### 7.3 Sitemap/robots
- `/sitemap.xml` генерируется автоматически
- `/robots.txt` настраивается

### 7.4 JSON-LD (опционально, но желательно)
Для страниц квизов/каталога — структурированные данные (если есть смысл).

---

## 8) Структура репозитория (рекомендуемая)

Пример:

- `app/`
  - `[locale]/`
    - `(public)/`
    - `(protected)/me/`
    - `(admin)/admin/`
    - `layout.tsx`
    - `page.tsx`
  - `api/`  ← BFF (route handlers)
- `features/`
  - `auth/`
  - `quiz-player/`
  - `quiz-admin/`
  - `user-admin/` (superadmin)
- `entities/`
  - `quiz/`
  - `attempt/`
  - `user/`
- `shared/`
  - `ui/`
  - `lib/`
  - `api/` (generated types + fetch clients)
  - `config/`
  - `types/`

Правило: **не** смешиваем “страницы” и “бизнес-логику”.  
Компоненты страниц тонкие, логика в features/entities.

---

## 9) Генерация типов из backend (обязательно)

Цель: типы и клиенты генерируются из спецификации backend (предпочтительно OpenAPI).

### 9.1 Вариант A (рекомендуется): OpenAPI → types + client
Инструменты:
- `openapi-typescript` (генерация типов)
- `openapi-typescript-codegen` или `orval` (генерация клиента)

Процесс:
1) Backend отдаёт `openapi.json` (URL или файл в репо).
2) В frontend добавляем скрипт:
   - `pnpm gen:api` / `npm run gen:api`
3) Сгенерированное попадает в `shared/api/generated/**`
4) Вручную не правим generated файлы.

Требования к CI:
- генерация должна быть воспроизводимой
- по возможности проверяем, что generated актуален (diff)

### 9.2 Вариант B: если нет OpenAPI
- договориться о контракте (JSON schema / protobuf / вручную)
- но всё равно стремиться к OpenAPI

---

## 10) Ошибки, загрузки, пустые состояния

Единые правила UX:
- Loading: skeleton/spinner (без “скачков” layout)
- Empty state: отдельный компонент
- Errors:
  - 401 → попытка refresh, затем logout/редирект на login
  - 403 → страница 403
  - 404 → страница 404
  - 5xx → “что-то пошло не так” + retry

---

## 11) Тестирование (юнит-тесты обязательны)

### 11.1 Стек
- Jest + React Testing Library
- MSW для моков API
- (опционально) Playwright для 1–2 e2e сценариев

### 11.2 Что обязательно покрыть
1) `auth`:
   - успешный логин (мок)
   - ошибка логина
   - logout
2) `serverApi`:
   - подставляет токен
   - refresh при 401 и повтор запроса
3) `quiz-player`:
   - переходы по шагам
   - валидация ответов
   - отправка результата (мок)

Правило: тесты должны быть быстрыми и независимыми (не требуют реальный backend).

---

## 12) Code style и дисциплина

- `strict` TS включён.
- Любые `any` запрещены (кроме edge-case и с комментом).
- Общие утилиты только в `shared/lib`.
- Дублирование переводов/ключей не допускается.
- Никаких секретов в репозитории. Все URL/ключи — только через `.env` + schema.

---

## 13) Env переменные (пример)

- `JAVA_API_URL=https://api.example.com`
- `NEXT_PUBLIC_APP_URL=https://app.example.com`

Важно:
- всё, что начинается с `NEXT_PUBLIC_` видно браузеру — токены/секреты туда не класть.

---

## 14) Definition of Done (DoD) для фичи

Фича считается готовой, если:
- реализованы UI + состояние загрузки/ошибок/empty,
- эндпоинты через BFF,
- типы используются строго,
- добавлены/обновлены переводы RU/EN,
- добавлены юнит-тесты на критическую логику,
- линтер/форматтер проходят,
- нет утечек токенов в клиентский JS.

---

## 15) Открытые решения (зафиксировать при старте)

1) Выбор библиотеки i18n: `next-intl` vs `next-i18next`
2) Выбор data fetching слоя: TanStack Query vs RTK Query
3) Чем генерируем API клиент: orval vs openapi-typescript-codegen
4) Где хранится access token: httpOnly cookie (рекомендуется) или в памяти (не рекомендуется для SSR)


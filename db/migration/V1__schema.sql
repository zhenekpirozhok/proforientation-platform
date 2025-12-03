-- Базовая структура БД: расширения, enum-типы, таблицы

-- 1. Расширения
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- для gen_random_uuid()

-- 2. Enum-типы (роль пользователя, статус и режим обработки квиза)

CREATE TYPE user_role AS ENUM ('superadmin', 'admin', 'user');
CREATE TYPE quiz_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE quiz_processing_mode AS ENUM ('ml_riasec', 'llm');


CREATE TYPE question_type AS ENUM ('single_choice', 'multi_choice', 'liker_scale_5', 'liker_scale_7');

----------------------------------------------------------------------
-- 3. Справочник категорий профессий
----------------------------------------------------------------------

CREATE TABLE profession_categories (
  id   BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,      -- 'it', 'med', 'general', 'sap', ...
  name TEXT NOT NULL
);

----------------------------------------------------------------------
-- 4. Профессии
----------------------------------------------------------------------

CREATE TABLE professions (
  id             BIGSERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,   -- бизнес-код / slug
  title_default  TEXT NOT NULL,
  description    TEXT,
  category_id    BIGINT NOT NULL REFERENCES profession_categories(id),
  ml_class_code  TEXT                    -- код класса из ML-модели (может быть NULL)
);

----------------------------------------------------------------------
-- 5. Пользователи приложения
----------------------------------------------------------------------

CREATE TABLE users (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name  TEXT,
  role          user_role NOT NULL DEFAULT 'user',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

----------------------------------------------------------------------
-- 6. Квизы и версии квизов
----------------------------------------------------------------------

CREATE TABLE quizzes (
  id              BIGSERIAL PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,           -- 'riasec_main', 'sap_roles'
  title_default   TEXT NOT NULL,
  status          quiz_status NOT NULL DEFAULT 'draft',
  processing_mode quiz_processing_mode NOT NULL DEFAULT 'ml_riasec',
  category_id     BIGINT NOT NULL REFERENCES profession_categories(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_id       BIGINT NOT NULL REFERENCES users(id)     
);

CREATE TABLE quiz_versions (
  id           BIGSERIAL PRIMARY KEY,
  quiz_id      BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  version      INT NOT NULL,
  is_current   BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  CONSTRAINT uq_quiz_versions UNIQUE (quiz_id, version)
);

----------------------------------------------------------------------
-- 7. Вопросы и варианты ответов
----------------------------------------------------------------------

CREATE TABLE questions (
  id              BIGSERIAL PRIMARY KEY,
  quiz_version_id BIGINT NOT NULL REFERENCES quiz_versions(id) ON DELETE CASCADE,
  ord             INT NOT NULL,                     -- порядок в квизе
  qtype           question_type NOT NULL DEFAULT 'single_choice',
  text_default    TEXT NOT NULL
);

CREATE TABLE question_options (
  id            BIGSERIAL PRIMARY KEY,
  question_id   BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  ord           INT NOT NULL,                       -- порядок варианта
  label_default TEXT NOT NULL
);

----------------------------------------------------------------------
-- 8. Трейты / шкалы
----------------------------------------------------------------------

CREATE TABLE trait_profiles (
  id               BIGSERIAL PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,   -- 'R','I','A','S','E','C','SAP_DEV','SAP_FUNC',...
  name             TEXT NOT NULL,
  description      TEXT,
  bipolar_pair_code TEXT                  -- одинаковый для полюсов одной шкалы (если нужно)
);

----------------------------------------------------------------------
-- 9. Связь опций с трейтами (вес влияния)
----------------------------------------------------------------------

CREATE TABLE question_option_traits (
  question_option_id BIGINT NOT NULL
    REFERENCES question_options(id) ON DELETE CASCADE,
  trait_id           BIGINT NOT NULL
    REFERENCES trait_profiles(id) ON DELETE CASCADE,
  weight             NUMERIC NOT NULL DEFAULT 1.0,
  PRIMARY KEY (question_option_id, trait_id)
);

----------------------------------------------------------------------
-- 10. Попытки прохождения тестов
----------------------------------------------------------------------

CREATE TABLE attempts (
  id              BIGSERIAL PRIMARY KEY,
  quiz_version_id BIGINT NOT NULL REFERENCES quiz_versions(id),
  user_id         BIGINT REFERENCES users(id),
  guest_token     TEXT,
  locale          TEXT NOT NULL DEFAULT 'en',
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at    TIMESTAMPTZ,
  uuid            UUID NOT NULL DEFAULT gen_random_uuid(),
  CONSTRAINT chk_attempt_actor
    CHECK (
      (user_id IS NOT NULL AND guest_token IS NULL)
      OR (user_id IS NULL AND guest_token IS NOT NULL)
    )
);

----------------------------------------------------------------------
-- 11. Ответы
----------------------------------------------------------------------

CREATE TABLE answers (
  id          BIGSERIAL PRIMARY KEY,
  attempt_id  BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  option_id   BIGINT NOT NULL REFERENCES question_options(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


----------------------------------------------------------------------
-- 12. Результаты по трейтам для попытки
----------------------------------------------------------------------

CREATE TABLE attempt_trait_scores (
  attempt_id BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  trait_id   BIGINT NOT NULL REFERENCES trait_profiles(id) ON DELETE CASCADE,
  score      NUMERIC NOT NULL,
  PRIMARY KEY (attempt_id, trait_id)
);

----------------------------------------------------------------------
-- 13. Рекомендованные профессии по результатам попытки
----------------------------------------------------------------------

CREATE TABLE attempt_recommendations (
  id            BIGSERIAL PRIMARY KEY,
  attempt_id    BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  profession_id BIGINT NOT NULL REFERENCES professions(id),
  score         NUMERIC,
  llm_explanation TEXT
);

----------------------------------------------------------------------
-- 14. Связка квиз ↔ доступные профессии (ручной override)
----------------------------------------------------------------------

CREATE TABLE quiz_professions (
  quiz_id       BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  profession_id BIGINT NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  PRIMARY KEY (quiz_id, profession_id)
);

----------------------------------------------------------------------
-- 15. Переводы
----------------------------------------------------------------------

CREATE TABLE translations (
  id          BIGSERIAL PRIMARY KEY,
  entity_type TEXT NOT NULL
              CHECK (entity_type IN ('quiz','quiz_version','question',
                                      'question_option','profession')),
  entity_id   BIGINT NOT NULL,
  locale      TEXT NOT NULL,
  field       TEXT NOT NULL
              CHECK (field IN ('title','text','description')),
  text        TEXT NOT NULL,
  UNIQUE (entity_type, entity_id, locale, field)
);

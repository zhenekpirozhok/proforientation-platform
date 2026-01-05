-- Базовая структура БД: расширения, enum-типы, таблицы

-- 1. Расширения
CREATE EXTENSION IF NOT EXISTS pgcrypto; -- для gen_random_uuid()

-- 2. Enum-типы (роль пользователя, статус и режим обработки квиза)

CREATE TYPE user_role AS ENUM ('SUPERADMIN', 'ADMIN', 'USER');
CREATE TYPE quiz_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE quiz_processing_mode AS ENUM ('ML_RIASEC', 'LLM');
CREATE TYPE question_type AS ENUM ('SINGLE_CHOICE', 'MULTI_CHOICE', 'LIKER_SCALE_5', 'LIKER_SCALE_7');

----------------------------------------------------------------------
-- 3. Справочник категорий профессий
----------------------------------------------------------------------

CREATE TABLE profession_categories (
  id   SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,     
  name VARCHAR(255) NOT NULL,
  color_code VARCHAR(7) NOT NULL DEFAULT '#000000'       
);

----------------------------------------------------------------------
-- 4. Профессии
----------------------------------------------------------------------

CREATE TABLE professions (
  id             SERIAL PRIMARY KEY,
  code           VARCHAR(64) UNIQUE NOT NULL,   
  title_default  VARCHAR(255) NOT NULL,
  description    TEXT,                         
  ml_class_code  VARCHAR(64),                    
  category_id    INT NOT NULL REFERENCES profession_categories(id)
);

----------------------------------------------------------------------
-- 5. Пользователи приложения
----------------------------------------------------------------------

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(320) NOT NULL UNIQUE,  
  password_hash VARCHAR(255) NOT NULL,      
  display_name  VARCHAR(255),                   
  role          user_role NOT NULL DEFAULT 'USER',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

----------------------------------------------------------------------
-- 6. Квизы и версии квизов
----------------------------------------------------------------------

CREATE TABLE quizzes (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(64) NOT NULL UNIQUE, 
  title_default   VARCHAR(255) NOT NULL,
  status          quiz_status NOT NULL DEFAULT 'DRAFT',
  processing_mode quiz_processing_mode NOT NULL DEFAULT 'ML_RIASEC',
  category_id     INT NOT NULL REFERENCES profession_categories(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  author_id       INT NOT NULL REFERENCES users(id)     
);

CREATE TABLE quiz_versions (
  id           SERIAL PRIMARY KEY,
  quiz_id      INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  version      INT NOT NULL,
  is_current   BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  CONSTRAINT uq_quiz_versions UNIQUE (quiz_id, version)
);

----------------------------------------------------------------------
-- 7. Вопросы и варианты ответов
----------------------------------------------------------------------

CREATE TABLE questions (
  id              SERIAL PRIMARY KEY,
  quiz_version_id INT NOT NULL REFERENCES quiz_versions(id) ON DELETE CASCADE,
  ord             INT NOT NULL,                     
  qtype           question_type NOT NULL DEFAULT 'SINGLE_CHOICE',
  text_default    TEXT NOT NULL
);

CREATE TABLE question_options (
  id            SERIAL PRIMARY KEY,
  question_id   INT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  ord           INT NOT NULL,                       
  label_default VARCHAR(255) NOT NULL    
);

----------------------------------------------------------------------
-- 8. Трейты / шкалы
----------------------------------------------------------------------

CREATE TABLE trait_profiles (
  id               SERIAL PRIMARY KEY,
  code              VARCHAR(32) UNIQUE NOT NULL,
  name              VARCHAR(255) NOT NULL,
  description       TEXT,            
  bipolar_pair_code VARCHAR(32)       
);

----------------------------------------------------------------------
-- 9. Связь опций с трейтами (вес влияния)
----------------------------------------------------------------------

CREATE TABLE question_option_traits (
  question_option_id INT NOT NULL
    REFERENCES question_options(id) ON DELETE CASCADE,
  trait_id           INT NOT NULL
    REFERENCES trait_profiles(id) ON DELETE CASCADE,
  weight             NUMERIC NOT NULL DEFAULT 1.0,
  PRIMARY KEY (question_option_id, trait_id)
);

----------------------------------------------------------------------
-- 10. Попытки прохождения тестов
----------------------------------------------------------------------

CREATE TABLE attempts (
  id              SERIAL PRIMARY KEY,
  quiz_version_id INT NOT NULL REFERENCES quiz_versions(id),
  user_id         INT REFERENCES users(id),
  guest_token     VARCHAR(255),     
  locale          VARCHAR(10) NOT NULL DEFAULT 'en',
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
  id          SERIAL PRIMARY KEY,
  attempt_id  INT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  option_id   INT NOT NULL REFERENCES question_options(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

----------------------------------------------------------------------
-- 12. Результаты по трейтам для попытки
----------------------------------------------------------------------

CREATE TABLE attempt_trait_scores (
  attempt_id INT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  trait_id   INT NOT NULL REFERENCES trait_profiles(id) ON DELETE CASCADE,
  score      NUMERIC NOT NULL,
  PRIMARY KEY (attempt_id, trait_id)
);

----------------------------------------------------------------------
-- 13. Рекомендованные профессии по результатам попытки
----------------------------------------------------------------------

CREATE TABLE attempt_recommendations (
  id              SERIAL PRIMARY KEY,
  attempt_id      INT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  profession_id   INT NOT NULL REFERENCES professions(id),
  score           NUMERIC,
  llm_explanation TEXT
);

----------------------------------------------------------------------
-- 14. Связка квиз ↔ доступные профессии (ручной override)
----------------------------------------------------------------------

CREATE TABLE quiz_professions (
  quiz_id       INT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  profession_id INT NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  PRIMARY KEY (quiz_id, profession_id)
);

----------------------------------------------------------------------
-- 15. Переводы
----------------------------------------------------------------------

CREATE TABLE translations (
  id          SERIAL PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL
    CHECK (entity_type IN ('quiz','question','question_option','profession')),
  locale      VARCHAR(10) NOT NULL,
  field       VARCHAR(32) NOT NULL
    CHECK (field IN ('title','text','description')),
  text        TEXT NOT NULL,
  entity_id   INT NOT NULL,
  UNIQUE (entity_type, entity_id, locale, field)
);

----------------------------------------------------------------------
-- 16. Password Reset Token
----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS password_reset (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiry_date TIMESTAMP NOT NULL,

    CONSTRAINT fk_password_reset_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);
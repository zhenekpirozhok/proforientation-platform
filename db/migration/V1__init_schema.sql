-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS citext;

-- =========
-- USERS (admin vs non-admin)
-- =========
CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  email          CITEXT UNIQUE,                 -- NULL for guests (no account)
  password_hash  TEXT,
  display_name   TEXT,
  is_admin       BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active      BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========
-- QUIZ AUTHORING (versioned minimal)
-- =========
CREATE TABLE IF NOT EXISTS quizzes (
  id             BIGSERIAL PRIMARY KEY,
  code           TEXT UNIQUE NOT NULL,
  title_default  TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'     -- draft/published
);

CREATE TABLE IF NOT EXISTS quiz_versions (
  id             BIGSERIAL PRIMARY KEY,
  quiz_id        BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  version        INT NOT NULL,
  is_current     BOOLEAN NOT NULL DEFAULT FALSE,
  published_at   TIMESTAMPTZ,
  UNIQUE (quiz_id, version)
);

CREATE TABLE IF NOT EXISTS questions (
  id               BIGSERIAL PRIMARY KEY,
  quiz_version_id  BIGINT NOT NULL REFERENCES quiz_versions(id) ON DELETE CASCADE,
  qtype            TEXT NOT NULL,                  -- single/multi/likert/text
  ord              INT NOT NULL,
  required         BOOLEAN NOT NULL DEFAULT TRUE,
  text_default     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_options (
  id             BIGSERIAL PRIMARY KEY,
  question_id    BIGINT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  ord            INT NOT NULL,
  value_code     TEXT,
  label_default  TEXT NOT NULL
);

-- =========
-- QUIZ DELIVERY (attempts & answers) — guests supported
-- =========
CREATE TABLE IF NOT EXISTS attempts (
  id               BIGSERIAL PRIMARY KEY,
  quiz_id          BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
  quiz_version_id  BIGINT NOT NULL REFERENCES quiz_versions(id) ON DELETE RESTRICT,
  user_id          BIGINT REFERENCES users(id) ON DELETE SET NULL,  -- NULL = guest
  guest_token      TEXT,                                            -- identifies unauthenticated session
  locale           TEXT NOT NULL DEFAULT 'en',
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at     TIMESTAMPTZ,
  duration_sec     INT
);

CREATE UNIQUE INDEX IF NOT EXISTS attempts_guest_once_idx
  ON attempts(guest_token, quiz_version_id)
  WHERE guest_token IS NOT NULL AND submitted_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS answers (
  id             BIGSERIAL PRIMARY KEY,
  attempt_id     BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  question_id    BIGINT NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  option_id      BIGINT REFERENCES question_options(id) ON DELETE SET NULL,
  value_text     TEXT,
  value_numeric  NUMERIC,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS answers_attempt_idx ON answers(attempt_id);

-- =========
-- TRAITS (profiles) & SCORES
-- =========
CREATE TABLE IF NOT EXISTS trait_profiles (
  id           BIGSERIAL PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,            -- e.g., R,I,A,S,E,C
  name         TEXT NOT NULL,
  description  TEXT
);

CREATE TABLE IF NOT EXISTS attempt_trait_scores (
  attempt_id   BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  trait_id     BIGINT NOT NULL REFERENCES trait_profiles(id) ON DELETE CASCADE,
  score        NUMERIC NOT NULL,                -- normalized 0..1 (or raw)
  PRIMARY KEY (attempt_id, trait_id)
);

-- =========
-- PROFESSIONS & AI-ASSISTED MAPPING
-- =========
CREATE TABLE IF NOT EXISTS professions (
  id             BIGSERIAL PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  title_default  TEXT NOT NULL,
  description    TEXT,
  trait_vector   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"R":0.7,"I":0.2,...}
  ai_confidence  NUMERIC
);

CREATE TABLE IF NOT EXISTS profession_traits (
  profession_id BIGINT NOT NULL REFERENCES professions(id) ON DELETE CASCADE,
  trait_id      BIGINT NOT NULL REFERENCES trait_profiles(id) ON DELETE CASCADE,
  weight        NUMERIC NOT NULL DEFAULT 1.0,
  PRIMARY KEY (profession_id, trait_id)
);

CREATE TABLE IF NOT EXISTS attempt_recommendations (
  id             BIGSERIAL PRIMARY KEY,
  attempt_id     BIGINT NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
  profession_id  BIGINT NOT NULL REFERENCES professions(id) ON DELETE RESTRICT,
  score          NUMERIC,
  reasoning      JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- =========
-- MINIMAL LOCALIZATION
-- =========
CREATE TABLE IF NOT EXISTS translations (
  id            BIGSERIAL PRIMARY KEY,
  entity_type   TEXT NOT NULL,                    -- 'quiz','question','option','profession'
  entity_id     BIGINT NOT NULL,
  locale        TEXT NOT NULL,                    -- 'en','ru', ...
  field         TEXT NOT NULL,                    -- 'title','text','description'
  text          TEXT NOT NULL,
  UNIQUE (entity_type, entity_id, locale, field)
);

-- =========
-- Helpful indexes
-- =========
CREATE INDEX IF NOT EXISTS quizzes_code_idx         ON quizzes(code);
CREATE INDEX IF NOT EXISTS professions_slug_idx     ON professions(slug);
CREATE INDEX IF NOT EXISTS attempts_user_idx        ON attempts(user_id, submitted_at);
CREATE INDEX IF NOT EXISTS translations_entity_idx  ON translations(entity_type, entity_id);

-- Consistency guard: ensure quiz_version_id belongs to quiz_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_quiz_versions_id_quiz'
  ) THEN
    ALTER TABLE quiz_versions
      ADD CONSTRAINT uq_quiz_versions_id_quiz UNIQUE (id, quiz_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_attempts_version_matches_quiz'
  ) THEN
    ALTER TABLE attempts
      ADD CONSTRAINT fk_attempts_version_matches_quiz
      FOREIGN KEY (quiz_version_id, quiz_id)
      REFERENCES quiz_versions (id, quiz_id)
      ON UPDATE RESTRICT ON DELETE RESTRICT;
  END IF;
END$$;

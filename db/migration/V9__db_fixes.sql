-- =========================
-- V9__db_fixes.sql
-- =========================

-- -------------------------------------------------------------------
-- 0) Indexes for translations: speeds up all your *_ru/_en views
-- -------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_translations_entity_locale_field
  ON translations(entity_type, entity_id, locale, field);

-- -------------------------------------------------------------------
-- 1) Normalize translations data before tightening the CHECK
--    (otherwise Postgres will check the constraint on ALL existing rows and fail)
-- -------------------------------------------------------------------

-- Remove the old CHECK (if any)
ALTER TABLE translations
  DROP CONSTRAINT IF EXISTS translations_entity_type_check;

-- 1.1) Map possible old/incorrect entity_type values to new canonical values

-- Profession categories: different variants -> profession_category
UPDATE translations
SET entity_type = 'profession_category'
WHERE entity_type IN (
  'profession_categories',
  'professionCategory',
  'categories',
  'category',
  'profession_category' -- Just in case
);

-- Traits: different variants -> trait
UPDATE translations
SET entity_type = 'trait'
WHERE entity_type IN (
  'traits',
  'trait_profile',
  'trait_profiles',
  'traitProfile',
  'trait' -- Just in case
);

-- Question options: different variants -> question_option
UPDATE translations
SET entity_type = 'question_option'
WHERE entity_type IN (
  'option',
  'options',
  'questionOption',
  'question_options',
  'questionOptionLabel',
  'question_option' -- Just in case
);

-- Questions/quizzes/professions — just in case (if camelCase/plural was used)
UPDATE translations SET entity_type = 'question'
WHERE entity_type IN ('questions', 'Question');

UPDATE translations SET entity_type = 'quiz'
WHERE entity_type IN ('quizzes', 'Quiz');

UPDATE translations SET entity_type = 'profession'
WHERE entity_type IN ('professions', 'Profession');

-- 1.2) Normalize 'field' for question_option:
--      your column is called label_default, but translations.field allows only title/text/description
--      so for options we use field='text'
UPDATE translations
SET field = 'text'
WHERE entity_type = 'question_option'
  AND field IN ('label', 'option_label', 'optionLabel');

-- 1.3) (Optional) Clean up 'locale'
--      If there are empty locales, better set to 'en' (otherwise they won't match)
UPDATE translations
SET locale = 'en'
WHERE (locale IS NULL OR btrim(locale) = '');

-- -------------------------------------------------------------------
-- 1.4) Now it's safe to set the new CHECK
-- -------------------------------------------------------------------
ALTER TABLE translations
  ADD CONSTRAINT translations_entity_type_check
  CHECK (entity_type IN (
    'quiz',
    'question',
    'question_option',
    'profession',
    'trait',
    'profession_category'
  ));

-- -------------------------------------------------------------------
-- 2) Fix: question_options_ru/en used field='label' (which does not exist)
--     It should be field='text'
-- -------------------------------------------------------------------
CREATE OR REPLACE VIEW question_options_ru AS
SELECT
    qo.id,
    qo.question_id,
    qo.ord,
    COALESCE(t.text, qo.label_default) AS label
FROM question_options qo
LEFT JOIN translations t
    ON t.entity_type = 'question_option'
   AND t.entity_id   = qo.id
   AND t.field       = 'text'
   AND t.locale      = 'ru';

CREATE OR REPLACE VIEW question_options_en AS
SELECT
    qo.id,
    qo.question_id,
    qo.ord,
    COALESCE(t.text, qo.label_default) AS label
FROM question_options qo
LEFT JOIN translations t
    ON t.entity_type = 'question_option'
   AND t.entity_id   = qo.id
   AND t.field       = 'text'
   AND t.locale      = 'en';

-- -------------------------------------------------------------------
-- 3) Traits: views ru/en
--     Map: trait.name -> translations(field='title')
--              trait.description -> translations(field='description')
-- -------------------------------------------------------------------
CREATE OR REPLACE VIEW trait_profiles_ru AS
SELECT
  tp.id,
  tp.code,
  COALESCE(t_title.text, tp.name) AS name,
  COALESCE(t_desc.text, tp.description) AS description,
  tp.bipolar_pair_code
FROM trait_profiles tp
LEFT JOIN translations t_title
  ON t_title.entity_type = 'trait'
 AND t_title.entity_id   = tp.id
 AND t_title.field       = 'title'
 AND t_title.locale      = 'ru'
LEFT JOIN translations t_desc
  ON t_desc.entity_type = 'trait'
 AND t_desc.entity_id   = tp.id
 AND t_desc.field       = 'description'
 AND t_desc.locale      = 'ru';

CREATE OR REPLACE VIEW trait_profiles_en AS
SELECT
  tp.id,
  tp.code,
  COALESCE(t_title.text, tp.name) AS name,
  COALESCE(t_desc.text, tp.description) AS description,
  tp.bipolar_pair_code
FROM trait_profiles tp
LEFT JOIN translations t_title
  ON t_title.entity_type = 'trait'
 AND t_title.entity_id   = tp.id
 AND t_title.field       = 'title'
 AND t_title.locale      = 'en'
LEFT JOIN translations t_desc
  ON t_desc.entity_type = 'trait'
 AND t_desc.entity_id   = tp.id
 AND t_desc.field       = 'description'
 AND t_desc.locale      = 'en';

-- -------------------------------------------------------------------
-- 4) Profession categories: views ru/en
--     Map: category.name -> translations(field='title')
-- -------------------------------------------------------------------
CREATE OR REPLACE VIEW profession_categories_ru AS
SELECT
  pc.id,
  pc.code,
  COALESCE(t_title.text, pc.name) AS name,
  pc.color_code
FROM profession_categories pc
LEFT JOIN translations t_title
  ON t_title.entity_type = 'profession_category'
 AND t_title.entity_id   = pc.id
 AND t_title.field       = 'title'
 AND t_title.locale      = 'ru';

CREATE OR REPLACE VIEW profession_categories_en AS
SELECT
  pc.id,
  pc.code,
  COALESCE(t_title.text, pc.name) AS name,
  pc.color_code
FROM profession_categories pc
LEFT JOIN translations t_title
  ON t_title.entity_type = 'profession_category'
 AND t_title.entity_id   = pc.id
 AND t_title.field       = 'title'
 AND t_title.locale      = 'en';

-- -------------------------------------------------------------------
-- 5) Quiz: add optional description + default seconds per question
--     Update quizzes_ru/en to also return description (field='description')-- -------------------------------------------------------------------
ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS description_default TEXT;

ALTER TABLE quizzes
  ADD COLUMN IF NOT EXISTS seconds_per_question_default INT NOT NULL DEFAULT 30;

-- Update quizzes_ru/en to also return description (field='description')
CREATE OR REPLACE VIEW quizzes_ru AS
SELECT
    q.id,
    q.code,
    COALESCE(t_title.text, q.title_default) AS title,
    COALESCE(t_desc.text, q.description_default) AS description
FROM quizzes q
LEFT JOIN translations t_title
    ON t_title.entity_type = 'quiz'
   AND t_title.entity_id   = q.id
   AND t_title.field       = 'title'
   AND t_title.locale      = 'ru'
LEFT JOIN translations t_desc
    ON t_desc.entity_type = 'quiz'
   AND t_desc.entity_id   = q.id
   AND t_desc.field       = 'description'
   AND t_desc.locale      = 'ru';

CREATE OR REPLACE VIEW quizzes_en AS
SELECT
    q.id,
    q.code,
    COALESCE(t_title.text, q.title_default) AS title,
    COALESCE(t_desc.text, q.description_default) AS description
FROM quizzes q
LEFT JOIN translations t_title
    ON t_title.entity_type = 'quiz'
   AND t_title.entity_id   = q.id
   AND t_title.field       = 'title'
   AND t_title.locale      = 'en'
LEFT JOIN translations t_desc
    ON t_desc.entity_type = 'quiz'
   AND t_desc.entity_id   = q.id
   AND t_desc.field       = 'description'
   AND t_desc.locale      = 'en';

-- -------------------------------------------------------------------
-- 6) Metrics for frontend
-- -------------------------------------------------------------------
CREATE OR REPLACE VIEW v_quiz_public_metrics AS
WITH current_version AS (
  SELECT q.id AS quiz_id, q.code, q.status, q.category_id,
         q.seconds_per_question_default,
         qv.id AS quiz_version_id
  FROM quizzes q
  JOIN quiz_versions qv ON qv.quiz_id = q.id AND qv.is_current = TRUE
),
q_counts AS (
  SELECT cv.quiz_id, COUNT(*)::int AS questions_total
  FROM current_version cv
  JOIN questions qu ON qu.quiz_version_id = cv.quiz_version_id
  GROUP BY cv.quiz_id
),
a_stats AS (
  SELECT
    cv.quiz_id,
    COUNT(a.id)::int AS attempts_total,
    COUNT(a.submitted_at)::int AS attempts_submitted,
    AVG(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))) AS avg_duration_seconds
  FROM current_version cv
  LEFT JOIN attempts a ON a.quiz_version_id = cv.quiz_version_id
  GROUP BY cv.quiz_id
)
SELECT
  cv.quiz_id,
  cv.code AS quiz_code,
  cv.status AS quiz_status,
  cv.category_id,
  COALESCE(qc.questions_total, 0) AS questions_total,
  COALESCE(ast.attempts_total, 0) AS attempts_total,
  COALESCE(ast.attempts_submitted, 0) AS attempts_submitted,
  ast.avg_duration_seconds,
  CASE
    WHEN COALESCE(ast.attempts_submitted, 0) >= 30
         AND ast.avg_duration_seconds IS NOT NULL
      THEN ROUND(ast.avg_duration_seconds)::int
    ELSE (COALESCE(qc.questions_total, 0) * cv.seconds_per_question_default)::int
  END AS estimated_duration_seconds
FROM current_version cv
LEFT JOIN q_counts qc ON qc.quiz_id = cv.quiz_id
LEFT JOIN a_stats  ast ON ast.quiz_id = cv.quiz_id;

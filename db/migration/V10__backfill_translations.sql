-- =========================
-- V10__backfill_translations.sql
-- Backfill translations for: quiz (title/description), question (text),
-- question_option (text), profession (title/description),
-- trait (title/description), profession_category (title)
--
-- Strategy:
-- - detect locale by Cyrillic presence: ru if ~ '[А-Яа-яЁё]', else en
-- - insert only if missing (ON CONFLICT DO NOTHING)
-- - normalize legacy aliases/fields just in case
-- =========================

-- -------------------------------------------------------------------
-- 0) Normalize possible legacy rows in translations (safe no-op if none)
-- -------------------------------------------------------------------

-- Normalize entity_type aliases -> canonical
UPDATE translations SET entity_type = 'profession_category'
WHERE entity_type IN ('profession_categories', 'professionCategory', 'categories', 'category');

UPDATE translations SET entity_type = 'trait'
WHERE entity_type IN ('traits', 'trait_profile', 'trait_profiles', 'traitProfile');

UPDATE translations SET entity_type = 'question_option'
WHERE entity_type IN ('option', 'options', 'questionOption', 'question_options', 'questionOptionLabel');

UPDATE translations SET entity_type = 'question'
WHERE entity_type IN ('questions', 'Question');

UPDATE translations SET entity_type = 'quiz'
WHERE entity_type IN ('quizzes', 'Quiz');

UPDATE translations SET entity_type = 'profession'
WHERE entity_type IN ('professions', 'Profession');

-- Normalize option field name: label -> text
UPDATE translations
SET field = 'text'
WHERE entity_type = 'question_option'
  AND field IN ('label', 'option_label', 'optionLabel');

-- If someone accidentally stored quiz/question text as 'name'/'label', try to fix common ones
UPDATE translations SET field = 'title'
WHERE field IN ('name') AND entity_type IN ('quiz','profession','trait','profession_category');

-- -------------------------------------------------------------------
-- Helper: determine locale by Cyrillic (ru/en)
-- We'll do it inline in SELECT with CASE
-- -------------------------------------------------------------------

-- -------------------------------------------------------------------
-- 1) Quizzes: title_default -> translations(quiz, field=title)
-- -------------------------------------------------------------------
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'quiz' AS entity_type,
  q.id   AS entity_id,
  CASE WHEN q.title_default ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END AS locale,
  'title' AS field,
  q.title_default AS text
FROM quizzes q
WHERE q.title_default IS NOT NULL AND btrim(q.title_default) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

-- 2) Quizzes: description_default -> translations(quiz, field=description)
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'quiz',
  q.id,
  CASE WHEN q.description_default ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'description',
  q.description_default
FROM quizzes q
WHERE q.description_default IS NOT NULL AND btrim(q.description_default) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

-- -------------------------------------------------------------------
-- 3) Questions: text_default -> translations(question, field=text)
-- -------------------------------------------------------------------
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'question',
  q.id,
  CASE WHEN q.text_default ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'text',
  q.text_default
FROM questions q
WHERE q.text_default IS NOT NULL AND btrim(q.text_default) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

-- -------------------------------------------------------------------
-- 4) Question options: label_default -> translations(question_option, field=text)
-- -------------------------------------------------------------------
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'question_option',
  qo.id,
  CASE WHEN qo.label_default ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'text',
  qo.label_default
FROM question_options qo
WHERE qo.label_default IS NOT NULL AND btrim(qo.label_default) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

-- -------------------------------------------------------------------
-- 5) Professions: title_default/description -> translations(profession, title/description)
-- -------------------------------------------------------------------
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'profession',
  p.id,
  CASE WHEN p.title_default ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'title',
  p.title_default
FROM professions p
WHERE p.title_default IS NOT NULL AND btrim(p.title_default) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'profession',
  p.id,
  CASE WHEN p.description ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'description',
  p.description
FROM professions p
WHERE p.description IS NOT NULL AND btrim(p.description) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

-- -------------------------------------------------------------------
-- 6) Traits: trait_profiles.name/description -> translations(trait, title/description)
-- -------------------------------------------------------------------
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'trait',
  tp.id,
  CASE WHEN tp.name ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'title',
  tp.name
FROM trait_profiles tp
WHERE tp.name IS NOT NULL AND btrim(tp.name) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'trait',
  tp.id,
  CASE WHEN tp.description ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'description',
  tp.description
FROM trait_profiles tp
WHERE tp.description IS NOT NULL AND btrim(tp.description) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

-- -------------------------------------------------------------------
-- 7) Profession categories: profession_categories.name -> translations(profession_category, title)
-- -------------------------------------------------------------------
INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'profession_category',
  pc.id,
  CASE WHEN pc.name ~ '[А-Яа-яЁё]' THEN 'ru' ELSE 'en' END,
  'title',
  pc.name
FROM profession_categories pc
WHERE pc.name IS NOT NULL AND btrim(pc.name) <> ''
ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

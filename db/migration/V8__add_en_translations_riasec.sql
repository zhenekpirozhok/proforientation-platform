-- V8__add_en_translations_riasec.sql
-- Extend translations constraints and seed EN translations for the RIASEC quiz

------------------------------------------------------------
-- 0) Extend allowed entity_type values
------------------------------------------------------------
ALTER TABLE translations
  DROP CONSTRAINT IF EXISTS translations_entity_type_check;

ALTER TABLE translations
  ADD CONSTRAINT translations_entity_type_check
  CHECK (
    (entity_type)::text = ANY (
      (ARRAY[
        'quiz'::character varying,
        'question'::character varying,
        'question_option'::character varying,
        'profession'::character varying,
        'trait_profile'::character varying
      ])::text[]
    )
  );

------------------------------------------------------------
-- 1) EN title for the quiz
------------------------------------------------------------
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT
  'quiz',
  q.id,
  'en',
  'title',
  'RIASEC Career Orientation Test'
FROM quizzes q
WHERE q.code = 'riasec_main'
ON CONFLICT DO NOTHING;

------------------------------------------------------------
-- 2) EN descriptions for trait profiles
-- We do NOT insert 'name' because translations_field_check doesn't allow it.
-- trait_profiles.name is already English in your seeds.
------------------------------------------------------------
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT
  'trait_profile',
  tp.id,
  'en',
  'description',
  CASE tp.code
    WHEN 'R' THEN 'Hands-on, practical activities involving tools, machines and physical work.'
    WHEN 'I' THEN 'Analytical and research-focused activities involving investigation and problem solving.'
    WHEN 'A' THEN 'Creative activities involving art, design and self-expression.'
    WHEN 'S' THEN 'Helping, teaching, caring and supporting people.'
    WHEN 'E' THEN 'Leadership, persuasion, business and entrepreneurial activities.'
    WHEN 'C' THEN 'Structured, detail-oriented work with data, records and procedures.'
  END
FROM trait_profiles tp
WHERE tp.code IN ('R','I','A','S','E','C')
ON CONFLICT DO NOTHING;

------------------------------------------------------------
-- 3) EN translations for all questions of the current RIASEC version
-- Copy from text_default (already EN in V5)
------------------------------------------------------------
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT
  'question',
  q.id,
  'en',
  'text',
  q.text_default
FROM questions q
WHERE q.quiz_version_id = (
  SELECT qv.id
  FROM quiz_versions qv
  WHERE qv.quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
    AND qv.is_current = TRUE
)
ON CONFLICT DO NOTHING;

------------------------------------------------------------
-- 4) EN translations for all question options of the current RIASEC version
-- Copy from label_default (already EN in V5)
------------------------------------------------------------
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT
  'question_option',
  qo.id,
  'en',
  'text',
  qo.label_default
FROM question_options qo
WHERE qo.question_id IN (
  SELECT id
  FROM questions
  WHERE quiz_version_id = (
    SELECT qv.id
    FROM quiz_versions qv
    WHERE qv.quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
      AND qv.is_current = TRUE
  )
)
ON CONFLICT DO NOTHING;

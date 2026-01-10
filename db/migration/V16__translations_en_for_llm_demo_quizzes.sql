-- =========================================================
-- Add EN translations for auto-generated LLM demo quizzes
-- Targets quizzes with code LIKE 'llm_demo_%'
-- Adds translations for: quiz.title, quiz.description,
--                        question.text, question_option.text
-- Idempotent: ON CONFLICT DO NOTHING
-- =========================================================

-- 1) Quiz title + description
INSERT INTO translations (entity_type, locale, field, text, entity_id)
SELECT
  'quiz' AS entity_type,
  'en'  AS locale,
  'title' AS field,
  -- simple human-readable EN title derived from default RU title
  -- Example RU: "Мини-профиль (General) #1"
  -- EN output:  "Mini profile (General) #1"
  regexp_replace(q.title_default, '^Мини-профиль', 'Mini profile') AS text,
  q.id AS entity_id
FROM quizzes q
WHERE q.code LIKE 'llm_demo_%'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, locale, field, text, entity_id)
SELECT
  'quiz',
  'en',
  'description',
  'A short 4-question quiz. The result is explained by an LLM.' AS text,
  q.id
FROM quizzes q
WHERE q.code LIKE 'llm_demo_%'
ON CONFLICT DO NOTHING;


-- 2) Questions text
-- Since we used the same 4 templates everywhere, translate by ord
INSERT INTO translations (entity_type, locale, field, text, entity_id)
SELECT
  'question',
  'en',
  'text',
  CASE qu.ord
    WHEN 1 THEN 'When the task is new, you usually…'
    WHEN 2 THEN 'At work, you feel more comfortable when…'
    WHEN 3 THEN 'In a team, you usually…'
    WHEN 4 THEN 'What matters most to you is…'
    ELSE qu.text_default
  END AS text,
  qu.id AS entity_id
FROM questions qu
JOIN quiz_versions qv ON qv.id = qu.quiz_version_id
JOIN quizzes q ON q.id = qv.quiz_id
WHERE q.code LIKE 'llm_demo_%'
ON CONFLICT DO NOTHING;


-- 3) Question options text
-- Options are the same 4 everywhere; translate by option ord.
INSERT INTO translations (entity_type, locale, field, text, entity_id)
SELECT
  'question_option',
  'en',
  'text',
  CASE qo.ord
    WHEN 1 THEN 'Act right away'
    WHEN 2 THEN 'Understand first'
    WHEN 3 THEN 'Find an unconventional angle'
    WHEN 4 THEN 'Follow a clear plan'
    ELSE qo.label_default
  END AS text,
  qo.id AS entity_id
FROM question_options qo
JOIN questions qu ON qu.id = qo.question_id
JOIN quiz_versions qv ON qv.id = qu.quiz_version_id
JOIN quizzes q ON q.id = qv.quiz_id
WHERE q.code LIKE 'llm_demo_%'
ON CONFLICT DO NOTHING;

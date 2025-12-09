-- 1. Убеждаемся, что пользователь существует
INSERT INTO users (email, password_hash, display_name, role, is_active)
VALUES (
  'user1@example.com',
  '$2b$12$eZqFSMfJ8WJKL5JLEH6rFOWszRsXxDDFwZkEPIjgQq0QGPm0v9Rhu',
  'Test User One',
  'USER',
  TRUE
)
ON CONFLICT (email) DO NOTHING;


-- 2. Создаём попытку (ПОКА БЕЗ submitted_at, чтобы триггер не сработал до ответов)
WITH u AS (
  SELECT id AS user_id
  FROM users
  WHERE email = 'user1@example.com'
),
qv AS (
  SELECT id AS quiz_version_id
  FROM quiz_versions
  WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
    AND is_current = TRUE
)
INSERT INTO attempts (quiz_version_id, user_id, locale, started_at, submitted_at)
SELECT
  qv.quiz_version_id,
  u.user_id,
  'ru',
  now() - INTERVAL '5 minutes',
  NULL        -- submitted_at поставим позже отдельным UPDATE
FROM u, qv;


-- 3. Добавляем ответы для последней попытки этого пользователя по этому квизу
WITH att AS (
  SELECT a.id, a.quiz_version_id
  FROM attempts a
  JOIN users u ON u.id = a.user_id
  WHERE u.email = 'user1@example.com'
  ORDER BY a.started_at DESC
  LIMIT 1
),
q AS (
  SELECT id, ord
  FROM questions
  WHERE quiz_version_id = (SELECT quiz_version_id FROM att)
),
qo AS (
  SELECT
    qo.id AS option_id,
    qo.question_id,
    qo.ord AS option_ord
  FROM question_options qo
)
INSERT INTO answers (attempt_id, option_id)
SELECT
  (SELECT id FROM att),
  CASE
    WHEN q.ord BETWEEN  1 AND 16 THEN  -- первые 16 вопросов
      (SELECT option_id
       FROM qo
       WHERE qo.question_id = q.id AND qo.option_ord = 4)  -- «Скорее да»
    WHEN q.ord BETWEEN 17 AND 32 THEN  -- следующие 16
      (SELECT option_id
       FROM qo
       WHERE qo.question_id = q.id AND qo.option_ord = 5)  -- «Да»
    WHEN q.ord BETWEEN 33 AND 48 THEN  -- последние 16
      (SELECT option_id
       FROM qo
       WHERE qo.question_id = q.id AND qo.option_ord = 3)  -- «Нейтрально»
  END AS option_id
FROM q
ORDER BY q.ord;


-- 4. Завершаем попытку: теперь выставляем submitted_at → сработает триггер пересчёта трейтов
WITH att AS (
  SELECT a.id
  FROM attempts a
  JOIN users u ON u.id = a.user_id
  WHERE u.email = 'user1@example.com'
  ORDER BY a.started_at DESC
  LIMIT 1
)
UPDATE attempts
SET submitted_at = now()
WHERE id = (SELECT id FROM att);


-- 5. Добавляем выдуманную рекомендацию профессии для этой попытки

WITH att AS (
  SELECT a.id AS attempt_id
  FROM attempts a
  JOIN users u ON u.id = a.user_id
  WHERE u.email = 'user1@example.com'
  ORDER BY a.started_at DESC
  LIMIT 1
),
prof AS (
  SELECT id AS profession_id
  FROM professions
  WHERE code = 'design'
  LIMIT 1
)
INSERT INTO attempt_recommendations (
  attempt_id,
  profession_id,
  score,
  llm_explanation
)
SELECT
  att.attempt_id,
  prof.profession_id,
  0.87,   -- выдуманный итоговый балл
  'Пользователь проявляет выраженные художественные и креативные склонности. ' ||
  'Высокие значения по Artistic (A) указывают на предпочтение творческих задач, ' ||
  'нестандартного мышления и самовыражения.'
FROM att, prof;

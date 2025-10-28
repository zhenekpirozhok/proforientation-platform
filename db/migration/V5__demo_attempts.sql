-- Demo users (non-admin)
INSERT INTO users (email, password_hash, display_name, is_admin)
VALUES
  ('user1@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Пользователь 1', FALSE),
  ('user2@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Пользователь 2', FALSE)
ON CONFLICT (email) DO NOTHING;

-- Helper CTEs to reference quizzes, versions, questions, and options by order
WITH
qi AS (
  SELECT q.id AS quiz_id
  FROM quizzes q WHERE q.code = 'interests'
),
qv_i AS (
  SELECT qv.id AS quiz_version_id, qv.quiz_id
  FROM quiz_versions qv
  JOIN qi ON qi.quiz_id = qv.quiz_id
  WHERE qv.version = 1
),
qs_i AS (
  -- questions of 'interests' by ord
  SELECT qs.id, qs.ord
  FROM questions qs
  JOIN qv_i ON qs.quiz_version_id = qv_i.quiz_version_id
),
qo_i AS (
  -- options of 'interests' by (question ord, option ord)
  SELECT qo.id,
         qs_i.ord AS qord,
         qo.ord AS oord
  FROM question_options qo
  JOIN questions qs ON qo.question_id = qs.id
  JOIN qs_i ON qs.id = qs_i.id
),
qw AS (
  SELECT q.id AS quiz_id
  FROM quizzes q WHERE q.code = 'workstyle'
),
qv_w AS (
  SELECT qv.id AS quiz_version_id, qv.quiz_id
  FROM quiz_versions qv
  JOIN qw ON qw.quiz_id = qv.quiz_id
  WHERE qv.version = 1
),
qs_w AS (
  SELECT qs.id, qs.ord
  FROM questions qs
  JOIN qv_w ON qs.quiz_version_id = qv_w.quiz_version_id
),
qo_w AS (
  SELECT qo.id,
         qs_w.ord AS qord,
         qo.ord AS oord
  FROM question_options qo
  JOIN questions qs ON qo.question_id = qs.id
  JOIN qs_w ON qs.id = qs_w.id
),
u1 AS (SELECT id AS user1_id FROM users WHERE email='user1@example.com'),
u2 AS (SELECT id AS user2_id FROM users WHERE email='user2@example.com'),
adminu AS (SELECT id AS admin_id FROM users WHERE email='admin@example.com'),

-- ------------------------------------------------------------------
-- A1: user1 passes 'interests' (technical/analytical profile)
-- ------------------------------------------------------------------
a1 AS (
  INSERT INTO attempts (quiz_id, quiz_version_id, user_id, guest_token, locale, started_at, submitted_at, duration_sec)
  SELECT qv_i.quiz_id, qv_i.quiz_version_id, u1.user1_id, NULL, 'ru', now() - INTERVAL '7 days', now() - INTERVAL '7 days' + INTERVAL '3 minutes', 180
  FROM qv_i, u1
  RETURNING id
),
a1_ans AS (
  INSERT INTO answers (attempt_id, question_id, option_id, created_at)
  SELECT (SELECT id FROM a1),
         (SELECT id FROM qs_i WHERE ord=1),
         (SELECT id FROM qo_i WHERE qord=1 AND oord=1),  -- ANALYTIC
         now() - INTERVAL '7 days' + INTERVAL '10 seconds'
  UNION ALL
  SELECT (SELECT id FROM a1),
         (SELECT id FROM qs_i WHERE ord=2),
         (SELECT id FROM qo_i WHERE qord=2 AND oord=2),  -- PEOPLE_MED
         now() - INTERVAL '7 days' + INTERVAL '30 seconds'
  UNION ALL
  SELECT (SELECT id FROM a1),
         (SELECT id FROM qs_i WHERE ord=3),
         (SELECT id FROM qo_i WHERE qord=3 AND oord=1),  -- BUILD
         now() - INTERVAL '7 days' + INTERVAL '50 seconds'
  UNION ALL
  SELECT (SELECT id FROM a1),
         (SELECT id FROM qs_i WHERE ord=4),
         (SELECT id FROM qo_i WHERE qord=4 AND oord=1),  -- LAB
         now() - INTERVAL '7 days' + INTERVAL '70 seconds'
  UNION ALL
  SELECT (SELECT id FROM a1),
         (SELECT id FROM qs_i WHERE ord=5),
         (SELECT id FROM qo_i WHERE qord=5 AND oord=2),  -- LEAD
         now() - INTERVAL '7 days' + INTERVAL '90 seconds'
  RETURNING 1
),
a1_scores AS (
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT (SELECT id FROM a1), t.id, s.score
  FROM trait_profiles t
  JOIN (VALUES
    ('R', 0.85), ('I', 0.80), ('A', 0.20), ('S', 0.35), ('E', 0.45), ('C', 0.55)
  ) AS s(code, score) ON s.code = t.code
  RETURNING 1
),
a1_recs AS (
  INSERT INTO attempt_recommendations (attempt_id, profession_id, score, reasoning)
  SELECT (SELECT id FROM a1), p.id, sc.score, sc.reasoning
  FROM professions p
  JOIN (VALUES
    ('software-engineer', 0.94, '{"match":["R","I"],"note":"Сильный техно-аналитический профиль"}'),
    ('mechanical-engineer', 0.88, '{"match":["R"],"note":"Интерес к практическим задачам"}'),
    ('data-scientist', 0.83, '{"match":["I","C"],"note":"Аналитика и работа с данными"}')
  ) AS sc(slug, score, reasoning) ON sc.slug = p.slug
  RETURNING 1
),

-- ------------------------------------------------------------------
-- A2: guest passes 'interests' (creative/social)
-- ------------------------------------------------------------------
a2 AS (
  INSERT INTO attempts (quiz_id, quiz_version_id, user_id, guest_token, locale, started_at, submitted_at, duration_sec)
  SELECT qv_i.quiz_id, qv_i.quiz_version_id, NULL, 'g-abc-001', 'ru',
         now() - INTERVAL '5 days', now() - INTERVAL '5 days' + INTERVAL '4 minutes', 240
  FROM qv_i
  RETURNING id
),
a2_ans AS (
  INSERT INTO answers (attempt_id, question_id, option_id, created_at)
  SELECT (SELECT id FROM a2), (SELECT id FROM qs_i WHERE ord=1),
         (SELECT id FROM qo_i WHERE qord=1 AND oord=2), now() - INTERVAL '5 days' + INTERVAL '10 seconds' -- CREATIVE
  UNION ALL
  SELECT (SELECT id FROM a2), (SELECT id FROM qs_i WHERE ord=2),
         (SELECT id FROM qo_i WHERE qord=2 AND oord=1), now() - INTERVAL '5 days' + INTERVAL '30 seconds' -- PEOPLE_HIGH
  UNION ALL
  SELECT (SELECT id FROM a2), (SELECT id FROM qs_i WHERE ord=3),
         (SELECT id FROM qo_i WHERE qord=3 AND oord=3), now() - INTERVAL '5 days' + INTERVAL '50 seconds' -- DESIGN
  UNION ALL
  SELECT (SELECT id FROM a2), (SELECT id FROM qs_i WHERE ord=4),
         (SELECT id FROM qo_i WHERE qord=4 AND oord=3), now() - INTERVAL '5 days' + INTERVAL '70 seconds' -- STUDIO
  UNION ALL
  SELECT (SELECT id FROM a2), (SELECT id FROM qs_i WHERE ord=5),
         (SELECT id FROM qo_i WHERE qord=5 AND oord=1), now() - INTERVAL '5 days' + INTERVAL '90 seconds' -- HELP
  RETURNING 1
),
a2_scores AS (
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT (SELECT id FROM a2), t.id, s.score
  FROM trait_profiles t
  JOIN (VALUES
    ('R', 0.25), ('I', 0.35), ('A', 0.85), ('S', 0.80), ('E', 0.40), ('C', 0.30)
  ) AS s(code, score) ON s.code = t.code
  RETURNING 1
),
a2_recs AS (
  INSERT INTO attempt_recommendations (attempt_id, profession_id, score, reasoning)
  SELECT (SELECT id FROM a2), p.id, sc.score, sc.reasoning
  FROM professions p
  JOIN (VALUES
    ('ux-designer', 0.91, '{"match":["A","S"],"note":"Креативность и работа с людьми"}'),
    ('graphic-designer', 0.88, '{"match":["A"],"note":"Сильный художественный профиль"}'),
    ('marketing-manager', 0.72, '{"match":["A","E"],"note":"Креатив + влияние"}')
  ) AS sc(slug, score, reasoning) ON sc.slug = p.slug
  RETURNING 1
),

-- ------------------------------------------------------------------
-- A3: user2 passes 'interests' (social/helping)
-- ------------------------------------------------------------------
a3 AS (
  INSERT INTO attempts (quiz_id, quiz_version_id, user_id, guest_token, locale, started_at, submitted_at, duration_sec)
  SELECT qv_i.quiz_id, qv_i.quiz_version_id, u2.user2_id, NULL, 'ru',
         now() - INTERVAL '3 days', now() - INTERVAL '3 days' + INTERVAL '3 minutes', 180
  FROM qv_i, u2
  RETURNING id
),
a3_ans AS (
  INSERT INTO answers (attempt_id, question_id, option_id, created_at)
  SELECT (SELECT id FROM a3), (SELECT id FROM qs_i WHERE ord=1),
         (SELECT id FROM qo_i WHERE qord=1 AND oord=3), now() - INTERVAL '3 days' + INTERVAL '10 seconds' -- HANDS_ON (нейтрально)
  UNION ALL
  SELECT (SELECT id FROM a3), (SELECT id FROM qs_i WHERE ord=2),
         (SELECT id FROM qo_i WHERE qord=2 AND oord=1), now() - INTERVAL '3 days' + INTERVAL '30 seconds' -- PEOPLE_HIGH
  UNION ALL
  SELECT (SELECT id FROM a3), (SELECT id FROM qs_i WHERE ord=3),
         (SELECT id FROM qo_i WHERE qord=3 AND oord=1), now() - INTERVAL '3 days' + INTERVAL '50 seconds' -- BUILD (условно)
  UNION ALL
  SELECT (SELECT id FROM a3), (SELECT id FROM qs_i WHERE ord=4),
         (SELECT id FROM qo_i WHERE qord=4 AND oord=2), now() - INTERVAL '3 days' + INTERVAL '70 seconds' -- OFFICE
  UNION ALL
  SELECT (SELECT id FROM a3), (SELECT id FROM qs_i WHERE ord=5),
         (SELECT id FROM qo_i WHERE qord=5 AND oord=1), now() - INTERVAL '3 days' + INTERVAL '90 seconds' -- HELP
  RETURNING 1
),
a3_scores AS (
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT (SELECT id FROM a3), t.id, s.score
  FROM trait_profiles t
  JOIN (VALUES
    ('R', 0.35), ('I', 0.45), ('A', 0.40), ('S', 0.88), ('E', 0.45), ('C', 0.50)
  ) AS s(code, score) ON s.code = t.code
  RETURNING 1
),
a3_recs AS (
  INSERT INTO attempt_recommendations (attempt_id, profession_id, score, reasoning)
  SELECT (SELECT id FROM a3), p.id, sc.score, sc.reasoning
  FROM professions p
  JOIN (VALUES
    ('nurse', 0.92, '{"match":["S"],"note":"Сильная ориентация на помощь"}'),
    ('clinical-psychologist', 0.86, '{"match":["S"],"note":"Работа с людьми"}'),
    ('teacher', 0.80, '{"match":["S"],"note":"Обучение и наставничество"}')
  ) AS sc(slug, score, reasoning) ON sc.slug = p.slug
  RETURNING 1
),

-- ------------------------------------------------------------------
-- A4: guest passes 'workstyle' (conventional/structured)
-- ------------------------------------------------------------------
a4 AS (
  INSERT INTO attempts (quiz_id, quiz_version_id, user_id, guest_token, locale, started_at, submitted_at, duration_sec)
  SELECT qv_w.quiz_id, qv_w.quiz_version_id, NULL, 'g-xyz-777', 'ru',
         now() - INTERVAL '2 days', now() - INTERVAL '2 days' + INTERVAL '2 minutes', 120
  FROM qv_w
  RETURNING id
),
a4_ans AS (
  -- Likert answers: L3, L2, L2, L5 (тяготение к структуре)
  INSERT INTO answers (attempt_id, question_id, option_id, created_at)
  SELECT (SELECT id FROM a4), (SELECT id FROM qs_w WHERE ord=1),
         (SELECT id FROM qo_w WHERE qord=1 AND oord=3), now() - INTERVAL '2 days' + INTERVAL '10 seconds'
  UNION ALL
  SELECT (SELECT id FROM a4), (SELECT id FROM qs_w WHERE ord=2),
         (SELECT id FROM qo_w WHERE qord=2 AND oord=2), now() - INTERVAL '2 days' + INTERVAL '30 seconds'
  UNION ALL
  SELECT (SELECT id FROM a4), (SELECT id FROM qs_w WHERE ord=3),
         (SELECT id FROM qo_w WHERE qord=3 AND oord=2), now() - INTERVAL '2 days' + INTERVAL '50 seconds'
  UNION ALL
  SELECT (SELECT id FROM a4), (SELECT id FROM qs_w WHERE ord=4),
         (SELECT id FROM qo_w WHERE qord=4 AND oord=5), now() - INTERVAL '2 days' + INTERVAL '70 seconds'
  RETURNING 1
),
a4_scores AS (
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT (SELECT id FROM a4), t.id, s.score
  FROM trait_profiles t
  JOIN (VALUES
    ('R', 0.30), ('I', 0.45), ('A', 0.20), ('S', 0.40), ('E', 0.55), ('C', 0.85)
  ) AS s(code, score) ON s.code = t.code
  RETURNING 1
),
a4_recs AS (
  INSERT INTO attempt_recommendations (attempt_id, profession_id, score, reasoning)
  SELECT (SELECT id FROM a4), p.id, sc.score, sc.reasoning
  FROM professions p
  JOIN (VALUES
    ('accountant', 0.90, '{"match":["C"],"note":"Структура и аккуратность"}'),
    ('project-manager', 0.78, '{"match":["C","E"],"note":"Организация и координация"}'),
    ('lawyer', 0.70, '{"match":["C","I"],"note":"Порядок и анализ"}')
  ) AS sc(slug, score, reasoning) ON sc.slug = p.slug
  RETURNING 1
),

-- ------------------------------------------------------------------
-- A5: user1 retakes 'interests' (enterprising)
-- ------------------------------------------------------------------
a5 AS (
  INSERT INTO attempts (quiz_id, quiz_version_id, user_id, guest_token, locale, started_at, submitted_at, duration_sec)
  SELECT qv_i.quiz_id, qv_i.quiz_version_id, u1.user1_id, NULL, 'ru',
         now() - INTERVAL '1 days', now() - INTERVAL '1 days' + INTERVAL '5 minutes', 300
  FROM qv_i, u1
  RETURNING id
),
a5_ans AS (
  INSERT INTO answers (attempt_id, question_id, option_id, created_at)
  SELECT (SELECT id FROM a5), (SELECT id FROM qs_i WHERE ord=1),
         (SELECT id FROM qo_i WHERE qord=1 AND oord=1), now() - INTERVAL '1 days' + INTERVAL '10 seconds' -- ANALYTIC
  UNION ALL
  SELECT (SELECT id FROM a5), (SELECT id FROM qs_i WHERE ord=2),
         (SELECT id FROM qo_i WHERE qord=2 AND oord=2), now() - INTERVAL '1 days' + INTERVAL '30 seconds' -- PEOPLE_MED
  UNION ALL
  SELECT (SELECT id FROM a5), (SELECT id FROM qs_i WHERE ord=3),
         (SELECT id FROM qo_i WHERE qord=3 AND oord=2), now() - INTERVAL '1 days' + INTERVAL '50 seconds' -- EXPLORE
  UNION ALL
  SELECT (SELECT id FROM a5), (SELECT id FROM qs_i WHERE ord=4),
         (SELECT id FROM qo_i WHERE qord=4 AND oord=2), now() - INTERVAL '1 days' + INTERVAL '70 seconds' -- OFFICE
  UNION ALL
  SELECT (SELECT id FROM a5), (SELECT id FROM qs_i WHERE ord=5),
         (SELECT id FROM qo_i WHERE qord=5 AND oord=2), now() - INTERVAL '1 days' + INTERVAL '90 seconds' -- LEAD
  RETURNING 1
),
a5_scores AS (
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT (SELECT id FROM a5), t.id, s.score
  FROM trait_profiles t
  JOIN (VALUES
    ('R', 0.55), ('I', 0.65), ('A', 0.35), ('S', 0.50), ('E', 0.85), ('C', 0.60)
  ) AS s(code, score) ON s.code = t.code
  RETURNING 1
),
a5_recs AS (
  INSERT INTO attempt_recommendations (attempt_id, profession_id, score, reasoning)
  SELECT (SELECT id FROM a5), p.id, sc.score, sc.reasoning
  FROM professions p
  JOIN (VALUES
    ('project-manager', 0.89, '{"match":["E","C"],"note":"Лидерство и организация"}'),
    ('marketing-manager', 0.84, '{"match":["E","A"],"note":"Влияние и креатив"}'),
    ('lawyer', 0.72, '{"match":["E","I"],"note":"Аргументация и анализ"}')
  ) AS sc(slug, score, reasoning) ON sc.slug = p.slug
  RETURNING 1
),

-- ------------------------------------------------------------------
-- A6: guest passes 'workstyle' (tech/data oriented)
-- ------------------------------------------------------------------
a6 AS (
  INSERT INTO attempts (quiz_id, quiz_version_id, user_id, guest_token, locale, started_at, submitted_at, duration_sec)
  SELECT qv_w.quiz_id, qv_w.quiz_version_id, NULL, 'g-dat-314', 'ru',
         now() - INTERVAL '12 hours', now() - INTERVAL '12 hours' + INTERVAL '4 minutes', 240
  FROM qv_w
  RETURNING id
),
a6_ans AS (
  -- Likert answers: L5, L3, L3, L3 (сильный интерес к данным)
  INSERT INTO answers (attempt_id, question_id, option_id, created_at)
  SELECT (SELECT id FROM a6), (SELECT id FROM qs_w WHERE ord=1),
         (SELECT id FROM qo_w WHERE qord=1 AND oord=5), now() - INTERVAL '12 hours' + INTERVAL '10 seconds'
  UNION ALL
  SELECT (SELECT id FROM a6), (SELECT id FROM qs_w WHERE ord=2),
         (SELECT id FROM qo_w WHERE qord=2 AND oord=3), now() - INTERVAL '12 hours' + INTERVAL '30 seconds'
  UNION ALL
  SELECT (SELECT id FROM a6), (SELECT id FROM qs_w WHERE ord=3),
         (SELECT id FROM qo_w WHERE qord=3 AND oord=3), now() - INTERVAL '12 hours' + INTERVAL '50 seconds'
  UNION ALL
  SELECT (SELECT id FROM a6), (SELECT id FROM qs_w WHERE ord=4),
         (SELECT id FROM qo_w WHERE qord=4 AND oord=3), now() - INTERVAL '12 hours' + INTERVAL '70 seconds'
  RETURNING 1
),
a6_scores AS (
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT (SELECT id FROM a6), t.id, s.score
  FROM trait_profiles t
  JOIN (VALUES
    ('R', 0.40), ('I', 0.88), ('A', 0.30), ('S', 0.40), ('E', 0.45), ('C', 0.55)
  ) AS s(code, score) ON s.code = t.code
  RETURNING 1
)
-- end of big CTE
SELECT 1;

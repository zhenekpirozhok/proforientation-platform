-- ==============================
-- QUIZ 1: Career Interests
-- ==============================
INSERT INTO quizzes (code, title_default, status)
VALUES ('interests', 'Тест интересов (карьера)', 'published')
ON CONFLICT (code) DO NOTHING;

WITH q AS (SELECT id FROM quizzes WHERE code='interests')
INSERT INTO quiz_versions (quiz_id, version, is_current, published_at)
SELECT q.id, 1, TRUE, now() FROM q
ON CONFLICT (quiz_id, version) DO NOTHING;

-- Вставляем вопросы (5 шт.) и запоминаем их id+ord
WITH v AS (
  SELECT qv.id AS quiz_version_id
  FROM quiz_versions qv
  JOIN quizzes q ON qv.quiz_id = q.id
  WHERE q.code='interests' AND qv.version=1
),
ins AS (
  INSERT INTO questions (quiz_version_id, qtype, ord, required, text_default)
  SELECT v.quiz_version_id, 'single', 1, TRUE, 'Какие задачи вам нравятся больше всего?' FROM v
  UNION ALL SELECT v.quiz_version_id, 'single', 2, TRUE, 'Насколько вам важна работа с людьми?' FROM v
  UNION ALL SELECT v.quiz_version_id, 'single', 3, TRUE, 'Что приносит вам больше удовлетворения?' FROM v
  UNION ALL SELECT v.quiz_version_id, 'single', 4, TRUE, 'Какая среда вам ближе?' FROM v
  UNION ALL SELECT v.quiz_version_id, 'single', 5, TRUE, 'Выберите утверждение, близкое вам:' FROM v
  RETURNING id, ord
)
-- Опции для каждого вопроса — без LATERAL, простыми литералами
INSERT INTO question_options (question_id, ord, value_code, label_default)
SELECT * FROM (
  -- Q1 (ord=1)
  SELECT (SELECT id FROM ins WHERE ord=1) AS question_id, 1 AS ord, 'ANALYTIC'  AS value_code, 'Аналитические / логические'     AS label_default UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=1), 2, 'CREATIVE',                           'Творческие / выразительные'                  UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=1), 3, 'HANDS_ON',                           'Практические / руками'                        UNION ALL
  -- Q2 (ord=2)
  SELECT (SELECT id FROM ins WHERE ord=2), 1, 'PEOPLE_HIGH',                        'Очень важно'                                  UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=2), 2, 'PEOPLE_MED',                         'Важность средняя'                             UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=2), 3, 'PEOPLE_LOW',                         'Не важно'                                     UNION ALL
  -- Q3 (ord=3)
  SELECT (SELECT id FROM ins WHERE ord=3), 1, 'BUILD',                              'Создавать и настраивать системы'              UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=3), 2, 'EXPLORE',                            'Исследовать идеи и закономерности'            UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=3), 3, 'DESIGN',                             'Проектировать визуальные решения'             UNION ALL
  -- Q4 (ord=4)
  SELECT (SELECT id FROM ins WHERE ord=4), 1, 'LAB',                                'Лаборатория / техника'                         UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=4), 2, 'OFFICE',                             'Офис / стабильные процессы'                    UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=4), 3, 'STUDIO',                             'Студия / креативное пространство'              UNION ALL
  -- Q5 (ord=5)
  SELECT (SELECT id FROM ins WHERE ord=5), 1, 'HELP',                               'Мне нравится помогать людям'                   UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=5), 2, 'LEAD',                               'Мне нравится организовывать и вести'           UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=5), 3, 'DETAIL',                             'Мне нравится упорядочивать и учитывать'
) t;

-- RU переводы для квиза, вопросов и опций
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'ru', 'title', 'Тест интересов (карьера)'
FROM quizzes q WHERE q.code='interests'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'question', qs.id, 'ru', 'text', qs.text_default
FROM questions qs
JOIN quiz_versions qv ON qs.quiz_version_id = qv.id
JOIN quizzes q ON qv.quiz_id = q.id
WHERE q.code='interests'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'option', qo.id, 'ru', 'text', qo.label_default
FROM question_options qo
JOIN questions qs ON qo.question_id = qs.id
JOIN quiz_versions qv ON qs.quiz_version_id = qv.id
JOIN quizzes q ON qv.quiz_id = q.id
WHERE q.code='interests'
ON CONFLICT DO NOTHING;

-- ==============================
-- QUIZ 2: Workstyle (Likert)
-- ==============================
INSERT INTO quizzes (code, title_default, status)
VALUES ('workstyle', 'Стиль работы (Likert)', 'published')
ON CONFLICT (code) DO NOTHING;

WITH q AS (SELECT id FROM quizzes WHERE code='workstyle')
INSERT INTO quiz_versions (quiz_id, version, is_current, published_at)
SELECT q.id, 1, TRUE, now() FROM q
ON CONFLICT (quiz_id, version) DO NOTHING;

WITH v AS (
  SELECT qv.id AS quiz_version_id
  FROM quiz_versions qv
  JOIN quizzes q ON qv.quiz_id = q.id
  WHERE q.code='workstyle' AND qv.version=1
),
ins AS (
  INSERT INTO questions (quiz_version_id, qtype, ord, required, text_default)
  SELECT v.quiz_version_id, 'likert', 1, TRUE, 'Мне комфортно работать с большим объёмом данных.' FROM v
  UNION ALL SELECT v.quiz_version_id, 'likert', 2, TRUE, 'Я получаю энергию от общения с людьми.' FROM v
  UNION ALL SELECT v.quiz_version_id, 'likert', 3, TRUE, 'Я склонен(на) к творческим экспериментам.' FROM v
  UNION ALL SELECT v.quiz_version_id, 'likert', 4, TRUE, 'Мне нравится чёткая структура и инструкции.' FROM v
  RETURNING id, ord
)
INSERT INTO question_options (question_id, ord, value_code, label_default)
SELECT * FROM (
  -- Likert 1..5 одинаковые для каждого вопроса
  SELECT (SELECT id FROM ins WHERE ord=1), 1, 'L1', 'Совсем не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=1), 2, 'L2', 'Скорее не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=1), 3, 'L3', 'Ни согласен(на), ни нет' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=1), 4, 'L4', 'Скорее согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=1), 5, 'L5', 'Полностью согласен(на)' UNION ALL

  SELECT (SELECT id FROM ins WHERE ord=2), 1, 'L1', 'Совсем не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=2), 2, 'L2', 'Скорее не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=2), 3, 'L3', 'Ни согласен(на), ни нет' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=2), 4, 'L4', 'Скорее согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=2), 5, 'L5', 'Полностью согласен(на)' UNION ALL

  SELECT (SELECT id FROM ins WHERE ord=3), 1, 'L1', 'Совсем не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=3), 2, 'L2', 'Скорее не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=3), 3, 'L3', 'Ни согласен(на), ни нет' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=3), 4, 'L4', 'Скорее согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=3), 5, 'L5', 'Полностью согласен(на)' UNION ALL

  SELECT (SELECT id FROM ins WHERE ord=4), 1, 'L1', 'Совсем не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=4), 2, 'L2', 'Скорее не согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=4), 3, 'L3', 'Ни согласен(на), ни нет' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=4), 4, 'L4', 'Скорее согласен(на)' UNION ALL
  SELECT (SELECT id FROM ins WHERE ord=4), 5, 'L5', 'Полностью согласен(на)'
) t;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'ru', 'title', 'Стиль работы (Likert)'
FROM quizzes q WHERE q.code='workstyle'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'question', qs.id, 'ru', 'text', qs.text_default
FROM questions qs
JOIN quiz_versions qv ON qs.quiz_version_id = qv.id
JOIN quizzes q ON qv.quiz_id = q.id
WHERE q.code='workstyle'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'option', qo.id, 'ru', 'text', qo.label_default
FROM question_options qo
JOIN questions qs ON qo.question_id = qs.id
JOIN quiz_versions qv ON qs.quiz_version_id = qv.id
JOIN quizzes q ON qv.quiz_id = q.id
WHERE q.code='workstyle'
ON CONFLICT DO NOTHING;

-- ==============================
-- PROFESSIONS (13 entries) with trait vectors
-- ==============================
INSERT INTO professions (slug, title_default, description, trait_vector, ai_confidence) VALUES
  ('software-engineer', 'Программист',
   'Проектирует и разрабатывает программные системы.',
   '{"R":0.70,"I":0.85,"A":0.20,"S":0.30,"E":0.35,"C":0.55}', 0.85),
  ('data-scientist', 'Специалист по данным',
   'Аналитика данных, машинное обучение, моделирование.',
   '{"R":0.40,"I":0.90,"A":0.35,"S":0.30,"E":0.40,"C":0.55}', 0.85),
  ('system-administrator', 'Системный администратор',
   'Поддержка инфраструктуры, серверов и сетей.',
   '{"R":0.75,"I":0.60,"A":0.15,"S":0.30,"E":0.30,"C":0.60}', 0.80),
  ('ux-designer', 'UX-дизайнер',
   'Проектирует пользовательский опыт и интерфейсы.',
   '{"R":0.25,"I":0.45,"A":0.85,"S":0.55,"E":0.40,"C":0.35}', 0.80),
  ('clinical-psychologist', 'Клинический психолог',
   'Диагностика и поддержка психического здоровья.',
   '{"R":0.15,"I":0.45,"A":0.30,"S":0.90,"E":0.35,"C":0.45}', 0.75),
  ('teacher', 'Учитель',
   'Преподавание и наставничество.',
   '{"R":0.25,"I":0.55,"A":0.40,"S":0.80,"E":0.45,"C":0.50}', 0.75),
  ('mechanical-engineer', 'Инженер-механик',
   'Проектирование и обслуживание механических систем.',
   '{"R":0.85,"I":0.70,"A":0.25,"S":0.30,"E":0.40,"C":0.55}', 0.80),
  ('electrician', 'Электромонтер',
   'Монтаж и обслуживание электрических систем.',
   '{"R":0.85,"I":0.55,"A":0.15,"S":0.25,"E":0.30,"C":0.50}', 0.75),
  ('nurse', 'Медицинская сестра',
   'Уход за пациентами и помощь врачам.',
   '{"R":0.35,"I":0.45,"A":0.30,"S":0.90,"E":0.35,"C":0.55}', 0.75),
  ('marketing-manager', 'Маркетолог',
   'Маркетинговая стратегия и продвижение.',
   '{"R":0.20,"I":0.55,"A":0.55,"S":0.65,"E":0.80,"C":0.45}', 0.80),
  ('accountant', 'Бухгалтер',
   'Финансовый учет, отчеты, налоги.',
   '{"R":0.20,"I":0.55,"A":0.15,"S":0.30,"E":0.35,"C":0.90}', 0.80),
  ('lawyer', 'Юрист',
   'Правовой анализ, сопровождение сделок, судопроизводство.',
   '{"R":0.25,"I":0.65,"A":0.25,"S":0.50,"E":0.70,"C":0.60}', 0.80),
  ('project-manager', 'Руководитель проектов',
   'Планирование, координация и сдача проектов.',
   '{"R":0.30,"I":0.55,"A":0.35,"S":0.60,"E":0.85,"C":0.65}', 0.85)
ON CONFLICT (slug) DO NOTHING;

-- Manual tuning for a few professions (profession_traits)
INSERT INTO profession_traits (profession_id, trait_id, weight)
SELECT p.id, t.id, 1.25 FROM professions p
JOIN trait_profiles t ON t.code='A'
WHERE p.slug='ux-designer'
ON CONFLICT DO NOTHING;

INSERT INTO profession_traits (profession_id, trait_id, weight)
SELECT p.id, t.id, 1.20 FROM professions p
JOIN trait_profiles t ON t.code='S'
WHERE p.slug='nurse'
ON CONFLICT DO NOTHING;

INSERT INTO profession_traits (profession_id, trait_id, weight)
SELECT p.id, t.id, 1.20 FROM professions p
JOIN trait_profiles t ON t.code='C'
WHERE p.slug='accountant'
ON CONFLICT DO NOTHING;

-- RU translations for professions (title + description)
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'profession', p.id, 'ru', 'title', p.title_default FROM professions p
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'profession', p.id, 'ru', 'description',
  COALESCE(p.description, 'Описание недоступно')
FROM professions p
ON CONFLICT DO NOTHING;

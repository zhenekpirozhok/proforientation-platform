INSERT INTO trait_profiles (code, name, description)
VALUES
  ('ACT', 'Ориентация на действие',
   'Склонность быстро переходить от идей к действиям и решениям.'),

  ('ANA', 'Аналитический подход',
   'Стремление сначала разобраться в деталях и возможных вариантах.'),

  ('CRE', 'Креативное мышление',
   'Поиск нестандартных идей и оригинальных решений.'),

  ('STR', 'Структурность',
   'Предпочтение чётких правил, процессов и понятных рамок.'),

  ('SOC', 'Ориентация на людей',
   'Фокус на взаимодействии, обсуждениях и совместной работе.'),

  ('AUT', 'Самостоятельность',
   'Потребность в автономии и личной ответственности.');

INSERT INTO quizzes (
  code,
  title_default,
  description_default,
  status,
  processing_mode,
  category_id,
  author_id
)
VALUES (
  'llm_decision_style',
  'Мини-профиль: как вы принимаете решения',
  'Три коротких вопроса, чтобы понять ваш стиль мышления и работы. Результат объясняется LLM.',
  'PUBLISHED',
  'LLM',
  (SELECT id FROM profession_categories WHERE code = 'general'),
  (SELECT id FROM users WHERE email = 'ya.kavalchuk@gmail.com')
)
ON CONFLICT (code) DO NOTHING;


INSERT INTO quiz_versions (quiz_id, version, is_current, published_at)
VALUES (
  (SELECT id FROM quizzes WHERE code = 'llm_decision_style'),
  1,
  TRUE,
  now()
)
ON CONFLICT (quiz_id, version) DO NOTHING;

WITH qv AS (
  SELECT id FROM quiz_versions
  WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'llm_decision_style')
    AND is_current = TRUE
)
INSERT INTO questions (quiz_version_id, ord, qtype, text_default)
VALUES
((SELECT id FROM qv), 1, 'SINGLE_CHOICE',
 'Если вы сталкиваетесь с новой задачей, что вы делаете в первую очередь?'),

((SELECT id FROM qv), 2, 'SINGLE_CHOICE',
 'В рабочем процессе вам комфортнее, когда…'),

((SELECT id FROM qv), 3, 'SINGLE_CHOICE',
 'Что для вас важнее при выполнении задачи?');

WITH q AS (
  SELECT id, ord FROM questions
  WHERE quiz_version_id = (
    SELECT id FROM quiz_versions
    WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'llm_decision_style')
      AND is_current = TRUE
  )
)
INSERT INTO question_options (question_id, ord, label_default)
SELECT q.id, o.ord, o.label
FROM q
JOIN (
  VALUES
  -- Q1
  (1, 1, 'Сразу пробую и смотрю, что получится'),
  (1, 2, 'Собираю информацию и обдумываю варианты'),
  (1, 3, 'Ищу нестандартный подход'),
  (1, 4, 'Сначала определяю чёткий план'),

  -- Q2
  (2, 1, 'Есть свобода действий и минимум ограничений'),
  (2, 2, 'Есть понятные правила и структура'),
  (2, 3, 'Можно активно общаться и обсуждать'),
  (2, 4, 'Можно работать в одиночку'),

  -- Q3
  (3, 1, 'Скорость результата'),
  (3, 2, 'Качество и точность'),
  (3, 3, 'Оригинальность решения'),
  (3, 4, 'Предсказуемость процесса')
) AS o(q_ord, ord, label)
ON q.ord = o.q_ord;

WITH
traits AS (
  SELECT code, id FROM trait_profiles
),
opts AS (
  SELECT qo.id, q.ord AS q_ord, qo.ord AS o_ord
  FROM question_options qo
  JOIN questions q ON q.id = qo.question_id
  WHERE q.quiz_version_id = (
    SELECT id FROM quiz_versions
    WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'llm_decision_style')
      AND is_current = TRUE
  )
)
INSERT INTO question_option_traits (question_option_id, trait_id, weight)
SELECT
  opts.id,
  t.id,
  1.0
FROM opts
JOIN traits t ON
  (opts.q_ord = 1 AND opts.o_ord = 1 AND t.code = 'ACT') OR
  (opts.q_ord = 1 AND opts.o_ord = 2 AND t.code = 'ANA') OR
  (opts.q_ord = 1 AND opts.o_ord = 3 AND t.code = 'CRE') OR
  (opts.q_ord = 1 AND opts.o_ord = 4 AND t.code = 'STR') OR

  (opts.q_ord = 2 AND opts.o_ord = 1 AND t.code = 'AUT') OR
  (opts.q_ord = 2 AND opts.o_ord = 2 AND t.code = 'STR') OR
  (opts.q_ord = 2 AND opts.o_ord = 3 AND t.code = 'SOC') OR
  (opts.q_ord = 2 AND opts.o_ord = 4 AND t.code = 'AUT') OR

  (opts.q_ord = 3 AND opts.o_ord = 1 AND t.code = 'ACT') OR
  (opts.q_ord = 3 AND opts.o_ord = 2 AND t.code = 'ANA') OR
  (opts.q_ord = 3 AND opts.o_ord = 3 AND t.code = 'CRE') OR
  (opts.q_ord = 3 AND opts.o_ord = 4 AND t.code = 'STR');

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'ru', 'title',
       'Мини-профиль: как вы принимаете решения'
FROM quizzes q WHERE q.code = 'llm_decision_style'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'ru', 'description',
       'Три коротких вопроса, чтобы понять ваш стиль мышления и работы. Объяснение формирует ИИ.'
FROM quizzes q WHERE q.code = 'llm_decision_style'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'en', 'title',
       'Mini profile: how you make decisions'
FROM quizzes q WHERE q.code = 'llm_decision_style'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'en', 'description',
       'Three short questions to understand your thinking and working style. Explained by AI.'
FROM quizzes q WHERE q.code = 'llm_decision_style'
ON CONFLICT DO NOTHING;

-- ACT
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'title', 'Ориентация на действие'
FROM trait_profiles WHERE code = 'ACT'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'description',
       'Склонность быстро переходить от размышлений к действиям.'
FROM trait_profiles WHERE code = 'ACT'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'title', 'Action-oriented'
FROM trait_profiles WHERE code = 'ACT'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'description',
       'A tendency to move quickly from thinking to action.'
FROM trait_profiles WHERE code = 'ACT'
ON CONFLICT DO NOTHING;

-- ANA
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'title', 'Аналитический подход'
FROM trait_profiles WHERE code = 'ANA'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'description',
       'Стремление сначала разобраться в деталях и возможных вариантах.'
FROM trait_profiles WHERE code = 'ANA'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'title', 'Analytical approach'
FROM trait_profiles WHERE code = 'ANA'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'description',
       'A preference for understanding details and exploring options first.'
FROM trait_profiles WHERE code = 'ANA'
ON CONFLICT DO NOTHING;

-- CRE
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'title', 'Креативное мышление'
FROM trait_profiles WHERE code = 'CRE'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'description',
       'Поиск нестандартных и оригинальных решений.'
FROM trait_profiles WHERE code = 'CRE'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'title', 'Creative thinking'
FROM trait_profiles WHERE code = 'CRE'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'description',
       'A tendency to look for original and unconventional solutions.'
FROM trait_profiles WHERE code = 'CRE'
ON CONFLICT DO NOTHING;

-- STR
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'title', 'Структурность'
FROM trait_profiles WHERE code = 'STR'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'description',
       'Предпочтение чётких правил, процессов и понятных рамок.'
FROM trait_profiles WHERE code = 'STR'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'title', 'Structure-oriented'
FROM trait_profiles WHERE code = 'STR'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'description',
       'A preference for clear rules, processes, and structure.'
FROM trait_profiles WHERE code = 'STR'
ON CONFLICT DO NOTHING;

-- SOC
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'title', 'Ориентация на людей'
FROM trait_profiles WHERE code = 'SOC'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'description',
       'Фокус на взаимодействии, обсуждениях и совместной работе.'
FROM trait_profiles WHERE code = 'SOC'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'title', 'People-oriented'
FROM trait_profiles WHERE code = 'SOC'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'description',
       'A focus on collaboration, discussion, and interaction.'
FROM trait_profiles WHERE code = 'SOC'
ON CONFLICT DO NOTHING;

-- AUT
INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'title', 'Самостоятельность'
FROM trait_profiles WHERE code = 'AUT'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'ru', 'description',
       'Потребность в автономии и личной ответственности.'
FROM trait_profiles WHERE code = 'AUT'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'title', 'Autonomy'
FROM trait_profiles WHERE code = 'AUT'
ON CONFLICT DO NOTHING;

INSERT INTO translations (entity_type, entity_id, locale, field, text)
SELECT 'trait', id, 'en', 'description',
       'A need for independence and personal responsibility.'
FROM trait_profiles WHERE code = 'AUT'
ON CONFLICT DO NOTHING;


DO $$
DECLARE
  q RECORD;
  ru TEXT[] := ARRAY[
    'Если вы сталкиваетесь с новой задачей, что вы делаете в первую очередь?',
    'В рабочем процессе вам комфортнее, когда…',
    'Что для вас важнее при выполнении задачи?'
  ];
  en TEXT[] := ARRAY[
    'When you face a new task, what do you do first?',
    'In your work process, you feel more comfortable when…',
    'What matters more to you when completing a task?'
  ];
BEGIN
  FOR q IN
    SELECT id, ord FROM questions
    WHERE quiz_version_id = (
      SELECT id FROM quiz_versions
      WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'llm_decision_style')
        AND is_current = TRUE
    )
    ORDER BY ord
  LOOP
    INSERT INTO translations (entity_type, entity_id, locale, field, text)
    VALUES
      ('question', q.id, 'ru', 'text', ru[q.ord]),
      ('question', q.id, 'en', 'text', en[q.ord])
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

DO $$
DECLARE
  o RECORD;
  ru TEXT[] := ARRAY[
    'Сразу пробую и смотрю, что получится',
    'Собираю информацию и обдумываю варианты',
    'Ищу нестандартный подход',
    'Сначала определяю чёткий план',

    'Есть свобода действий и минимум ограничений',
    'Есть понятные правила и структура',
    'Можно активно общаться и обсуждать',
    'Можно работать в одиночку',

    'Скорость результата',
    'Качество и точность',
    'Оригинальность решения',
    'Предсказуемость процесса'
  ];
  en TEXT[] := ARRAY[
    'I try it right away and see what happens',
    'I gather information and think through options',
    'I look for an unconventional approach',
    'I first define a clear plan',

    'There is freedom of action and minimal constraints',
    'There are clear rules and structure',
    'There is active communication and discussion',
    'I can work on my own',

    'Speed of results',
    'Quality and accuracy',
    'Originality of the solution',
    'Predictability of the process'
  ];
  i INT := 0;
BEGIN
  FOR o IN
    SELECT id FROM question_options
    WHERE question_id IN (
      SELECT id FROM questions
      WHERE quiz_version_id = (
        SELECT id FROM quiz_versions
        WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'llm_decision_style')
          AND is_current = TRUE
      )
    )
    ORDER BY id
  LOOP
    i := i + 1;
    INSERT INTO translations (entity_type, entity_id, locale, field, text)
    VALUES
      ('question_option', o.id, 'ru', 'text', ru[i]),
      ('question_option', o.id, 'en', 'text', en[i])
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

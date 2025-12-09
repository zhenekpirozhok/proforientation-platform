-- Трейты RIASEC
INSERT INTO trait_profiles (code, name, description, bipolar_pair_code)
VALUES
  ('R', 'Realistic',
   'Практико-ориентированный тип: работа руками, техника, механизмы.',
   NULL),
  ('I', 'Investigative',
   'Исследовательский тип: анализ, наука, решение сложных задач.',
   NULL),
  ('A', 'Artistic',
   'Творческий тип: искусство, дизайн, самовыражение.',
   NULL),
  ('S', 'Social',
   'Социальный тип: помощь людям, обучение, консультирование.',
   NULL),
  ('E', 'Enterprising',
   'Предпринимательский тип: управление, продажи, влияние.',
   NULL),
  ('C', 'Conventional',
   'Конвенциональный тип: структурированные задачи, учет, документы.',
   NULL);


-- 1. Убедимся, что квиз RIASEC существует
INSERT INTO quizzes (code, title_default, status, processing_mode, category_id, author_id)
VALUES (
  'riasec_main',
  'RIASEC: профориентационный тест',
  'published',
  'ml_riasec',
  (SELECT id FROM profession_categories WHERE code = 'general'),
  (SELECT id FROM users WHERE email = 'ya.kavalchuk@gmail.com')
)
ON CONFLICT (code) DO NOTHING;


-- 2. Создаём (или оставляем) версию 1 как текущую
INSERT INTO quiz_versions (quiz_id, version, is_current, published_at)
VALUES (
  (SELECT id FROM quizzes WHERE code = 'riasec_main'),
  1,
  TRUE,
  now()
)
ON CONFLICT (quiz_id, version) DO NOTHING;


-- 3. Вопросы (48 штук, по 8 на каждый трейт R/I/A/S/E/C), тип liker_scale_5
WITH current_qv AS (
  SELECT id
  FROM quiz_versions
  WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
    AND is_current = TRUE
)
INSERT INTO questions (quiz_version_id, ord, qtype, text_default)
VALUES
  -- R (Realistic)
  ((SELECT id FROM current_qv),  1, 'liker_scale_5',
   'Мне нравится работать руками с инструментами, оборудованием или механизмами.'),
  ((SELECT id FROM current_qv),  2, 'liker_scale_5',
   'Я предпочитаю практическую работу, где результат можно увидеть или потрогать.'),
  ((SELECT id FROM current_qv),  3, 'liker_scale_5',
   'Мне интересно разбирать вещи, чинить технику или что-то собирать.'),
  ((SELECT id FROM current_qv),  4, 'liker_scale_5',
   'Я чувствую себя комфортно в мастерской, лаборатории или на производстве.'),
  ((SELECT id FROM current_qv),  5, 'liker_scale_5',
   'Я люблю задачи, где нужно что-то настроить, отрегулировать или оптимизировать работу устройства.'),
  ((SELECT id FROM current_qv),  6, 'liker_scale_5',
   'Меня привлекают профессии, связанные с техникой, инженерией или эксплуатацией оборудования.'),
  ((SELECT id FROM current_qv),  7, 'liker_scale_5',
   'Я предпочитаю чёткие инструкции и конкретные физические задачи, а не абстрактные обсуждения.'),
  ((SELECT id FROM current_qv),  8, 'liker_scale_5',
   'Мне нравится работать на открытом воздухе, выполнять физически активную или прикладную работу.'),

  -- I (Investigative)
  ((SELECT id FROM current_qv),  9, 'liker_scale_5',
   'Мне нравится анализировать информацию, данные или явления, чтобы понять, как всё устроено.'),
  ((SELECT id FROM current_qv), 10, 'liker_scale_5',
   'Я получаю удовольствие от решения сложных логических или математических задач.'),
  ((SELECT id FROM current_qv), 11, 'liker_scale_5',
   'Мне интересно проводить исследования, эксперименты или проверки гипотез.'),
  ((SELECT id FROM current_qv), 12, 'liker_scale_5',
   'Я люблю читать научно-популярные статьи, разбираться в причинах и следствиях.'),
  ((SELECT id FROM current_qv), 13, 'liker_scale_5',
   'Я предпочитаю проекты, в которых нужно разбираться в деталях и строить выводы.'),
  ((SELECT id FROM current_qv), 14, 'liker_scale_5',
   'Мне комфортно работать с формулами, моделями или аналитическими инструментами.'),
  ((SELECT id FROM current_qv), 15, 'liker_scale_5',
   'Меня привлекают профессии, связанные с наукой, аналитикой или исследованиями.'),
  ((SELECT id FROM current_qv), 16, 'liker_scale_5',
   'Мне важно сначала всё продумать и понять, прежде чем принимать решения или делать выводы.'),

  -- A (Artistic)
  ((SELECT id FROM current_qv), 17, 'liker_scale_5',
   'Мне нравится придумывать новые идеи, образы или нестандартные решения.'),
  ((SELECT id FROM current_qv), 18, 'liker_scale_5',
   'Я получаю удовольствие от творческих занятий: рисования, музыки, письма или дизайна.'),
  ((SELECT id FROM current_qv), 19, 'liker_scale_5',
   'Мне важна возможность самовыражения в работе, а не только чёткие правила и инструкции.'),
  ((SELECT id FROM current_qv), 20, 'liker_scale_5',
   'Я люблю проекты, в которых можно экспериментировать со стилем, формой или подачей.'),
  ((SELECT id FROM current_qv), 21, 'liker_scale_5',
   'Меня привлекают профессии, связанные с искусством, дизайном, медиа или творчеством.'),
  ((SELECT id FROM current_qv), 22, 'liker_scale_5',
   'Я часто замечаю визуальные детали: цвета, композицию, оформление пространства или интерфейсов.'),
  ((SELECT id FROM current_qv), 23, 'liker_scale_5',
   'Мне нравится придумывать сценарии, истории или концепции для проектов.'),
  ((SELECT id FROM current_qv), 24, 'liker_scale_5',
   'Я чувствую дискомфорт, когда работа слишком однообразная и не оставляет места креативности.'),

  -- S (Social)
  ((SELECT id FROM current_qv), 25, 'liker_scale_5',
   'Мне нравится помогать людям, объяснять что-то или поддерживать в сложных ситуациях.'),
  ((SELECT id FROM current_qv), 26, 'liker_scale_5',
   'Я получаю энергию от живого общения и командной работы.'),
  ((SELECT id FROM current_qv), 27, 'liker_scale_5',
   'Мне интересно обучать других, делиться опытом или менторить.'),
  ((SELECT id FROM current_qv), 28, 'liker_scale_5',
   'Я часто замечаю, в каком эмоциональном состоянии находятся люди вокруг.'),
  ((SELECT id FROM current_qv), 29, 'liker_scale_5',
   'Меня привлекают профессии, связанные с образованием, психологией, HR или социальной сферой.'),
  ((SELECT id FROM current_qv), 30, 'liker_scale_5',
   'Я готов тратить время, чтобы выслушать человека и помочь ему разобраться с проблемой.'),
  ((SELECT id FROM current_qv), 31, 'liker_scale_5',
   'Я чувствую себя уверенно, когда нужно взаимодействовать с разными людьми и строить отношения.'),
  ((SELECT id FROM current_qv), 32, 'liker_scale_5',
   'Я часто беру на себя роль “связующего звена” между людьми или командами.'),

  -- E (Enterprising)
  ((SELECT id FROM current_qv), 33, 'liker_scale_5',
   'Мне нравится влиять на решения других, убеждать и аргументировать свою позицию.'),
  ((SELECT id FROM current_qv), 34, 'liker_scale_5',
   'Я получаю удовольствие от ведения переговоров, презентаций или публичных выступлений.'),
  ((SELECT id FROM current_qv), 35, 'liker_scale_5',
   'Мне интересно управлять проектами, брать ответственность и принимать решения.'),
  ((SELECT id FROM current_qv), 36, 'liker_scale_5',
   'Я чувствую себя комфортно в условиях неопределённости, когда нужно быстро ориентироваться.'),
  ((SELECT id FROM current_qv), 37, 'liker_scale_5',
   'Меня привлекают профессии, связанные с бизнесом, управлением, продажами или предпринимательством.'),
  ((SELECT id FROM current_qv), 38, 'liker_scale_5',
   'Я люблю замечать новые возможности и предлагать инициативы, даже если это рискованно.'),
  ((SELECT id FROM current_qv), 39, 'liker_scale_5',
   'Мне важно видеть результат в виде достигнутых целей, показателей или роста.'),
  ((SELECT id FROM current_qv), 40, 'liker_scale_5',
   'Я легко беру на себя лидерскую роль в группе или проекте.'),

  -- C (Conventional)
  ((SELECT id FROM current_qv), 41, 'liker_scale_5',
   'Мне нравится работать с таблицами, отчётами или структурированными данными.'),
  ((SELECT id FROM current_qv), 42, 'liker_scale_5',
   'Я предпочитаю, когда есть чёткие правила, инструкции и понятные процедуры.'),
  ((SELECT id FROM current_qv), 43, 'liker_scale_5',
   'Я аккуратно отношусь к документам, срокам и формальным требованиям.'),
  ((SELECT id FROM current_qv), 44, 'liker_scale_5',
   'Мне комфортно выполнять рутинные задачи, если понятен их смысл и важность.'),
  ((SELECT id FROM current_qv), 45, 'liker_scale_5',
   'Меня привлекают профессии, связанные с бухгалтерией, административной или офисной работой.'),
  ((SELECT id FROM current_qv), 46, 'liker_scale_5',
   'Я люблю наводить порядок в информации: сортировать, систематизировать, структурировать.'),
  ((SELECT id FROM current_qv), 47, 'liker_scale_5',
   'Я предпочитаю завершать начатые дела и доводить задачи до конца по плану.'),
  ((SELECT id FROM current_qv), 48, 'liker_scale_5',
   'Я чувствую себя спокойно, когда рабочие процессы заранее организованы и предсказуемы.');


-- 4. Опции для КАЖДОГО вопроса: Нет / Скорее нет / Нейтрально / Скорее да / Да
WITH current_qv AS (
  SELECT id
  FROM quiz_versions
  WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
    AND is_current = TRUE
),
q AS (
  SELECT id, ord
  FROM questions
  WHERE quiz_version_id = (SELECT id FROM current_qv)
)
INSERT INTO question_options (question_id, ord, label_default)
SELECT
  q.id,
  o.ord,
  o.label_default
FROM q
CROSS JOIN (VALUES
  (1, 'Нет'),
  (2, 'Скорее нет'),
  (3, 'Нейтрально'),
  (4, 'Скорее да'),
  (5, 'Да')
) AS o(ord, label_default)
ORDER BY q.ord, o.ord;


-- 5. Связь опций с трейтами + веса по шкале 0, 0.25, 0.5, 0.75, 1.0
WITH current_qv AS (
  SELECT id
  FROM quiz_versions
  WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
    AND is_current = TRUE
),
traits AS (
  SELECT
    (SELECT id FROM trait_profiles WHERE code = 'R') AS r_id,
    (SELECT id FROM trait_profiles WHERE code = 'I') AS i_id,
    (SELECT id FROM trait_profiles WHERE code = 'A') AS a_id,
    (SELECT id FROM trait_profiles WHERE code = 'S') AS s_id,
    (SELECT id FROM trait_profiles WHERE code = 'E') AS e_id,
    (SELECT id FROM trait_profiles WHERE code = 'C') AS c_id
),
q AS (
  SELECT id, ord
  FROM questions
  WHERE quiz_version_id = (SELECT id FROM current_qv)
),
qo AS (
  SELECT
    qo.id,
    q.ord AS question_ord,
    qo.ord AS option_ord
  FROM q
  JOIN question_options qo ON qo.question_id = q.id
)
INSERT INTO question_option_traits (question_option_id, trait_id, weight)
SELECT
  qo.id,
  CASE
    WHEN qo.question_ord BETWEEN  1 AND  8 THEN traits.r_id
    WHEN qo.question_ord BETWEEN  9 AND 16 THEN traits.i_id
    WHEN qo.question_ord BETWEEN 17 AND 24 THEN traits.a_id
    WHEN qo.question_ord BETWEEN 25 AND 32 THEN traits.s_id
    WHEN qo.question_ord BETWEEN 33 AND 40 THEN traits.e_id
    WHEN qo.question_ord BETWEEN 41 AND 48 THEN traits.c_id
  END AS trait_id,
  CASE qo.option_ord
    WHEN 1 THEN 0.00   -- Нет
    WHEN 2 THEN 0.25   -- Скорее нет
    WHEN 3 THEN 0.50   -- Нейтрально
    WHEN 4 THEN 0.75   -- Скорее да
    WHEN 5 THEN 1.00   -- Да
  END AS weight
FROM qo
CROSS JOIN traits;

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
WITH qv AS (
    SELECT id AS quiz_version_id
    FROM quiz_versions
    WHERE quiz_id = (SELECT id FROM quizzes WHERE code = 'riasec_main')
      AND is_current = TRUE
)

INSERT INTO questions (quiz_version_id, ord, qtype, text_default)
VALUES
-- REALISTIC (R)
((SELECT quiz_version_id FROM qv), 1, 'liker_scale_5', 'Test the quality of parts before shipment'),
((SELECT quiz_version_id FROM qv), 2, 'liker_scale_5', 'Lay brick or tile'),
((SELECT quiz_version_id FROM qv), 3, 'liker_scale_5', 'Work on an offshore oil-drilling rig'),
((SELECT quiz_version_id FROM qv), 4, 'liker_scale_5', 'Assemble electronic parts'),
((SELECT quiz_version_id FROM qv), 5, 'liker_scale_5', 'Operate a grinding machine in a factory'),
((SELECT quiz_version_id FROM qv), 6, 'liker_scale_5', 'Fix a broken faucet'),
((SELECT quiz_version_id FROM qv), 7, 'liker_scale_5', 'Assemble products in a factory'),
((SELECT quiz_version_id FROM qv), 8, 'liker_scale_5', 'Install flooring in houses'),

-- INVESTIGATIVE (I)
((SELECT quiz_version_id FROM qv), 9, 'liker_scale_5', 'Study the structure of the human body'),
((SELECT quiz_version_id FROM qv), 10, 'liker_scale_5', 'Study animal behavior'),
((SELECT quiz_version_id FROM qv), 11, 'liker_scale_5', 'Do research on plants or animals'),
((SELECT quiz_version_id FROM qv), 12, 'liker_scale_5', 'Develop a new medical treatment or procedure'),
((SELECT quiz_version_id FROM qv), 13, 'liker_scale_5', 'Conduct biological research'),
((SELECT quiz_version_id FROM qv), 14, 'liker_scale_5', 'Study whales and other types of marine life'),
((SELECT quiz_version_id FROM qv), 15, 'liker_scale_5', 'Work in a biology lab'),
((SELECT quiz_version_id FROM qv), 16, 'liker_scale_5', 'Make a map of the bottom of an ocean'),

-- ARTISTIC (A)
((SELECT quiz_version_id FROM qv), 17, 'liker_scale_5', 'Conduct a musical choir'),
((SELECT quiz_version_id FROM qv), 18, 'liker_scale_5', 'Direct a play'),
((SELECT quiz_version_id FROM qv), 19, 'liker_scale_5', 'Design artwork for magazines'),
((SELECT quiz_version_id FROM qv), 20, 'liker_scale_5', 'Write a song'),
((SELECT quiz_version_id FROM qv), 21, 'liker_scale_5', 'Write books or plays'),
((SELECT quiz_version_id FROM qv), 22, 'liker_scale_5', 'Play a musical instrument'),
((SELECT quiz_version_id FROM qv), 23, 'liker_scale_5', 'Perform stunts for a movie or television show'),
((SELECT quiz_version_id FROM qv), 24, 'liker_scale_5', 'Design sets for plays'),

-- SOCIAL (S)
((SELECT quiz_version_id FROM qv), 25, 'liker_scale_5', 'Give career guidance to people'),
((SELECT quiz_version_id FROM qv), 26, 'liker_scale_5', 'Do volunteer work at a non-profit organization'),
((SELECT quiz_version_id FROM qv), 27, 'liker_scale_5', 'Help people who have problems with drugs or alcohol'),
((SELECT quiz_version_id FROM qv), 28, 'liker_scale_5', 'Teach an individual an exercise routine'),
((SELECT quiz_version_id FROM qv), 29, 'liker_scale_5', 'Help people with family-related problems'),
((SELECT quiz_version_id FROM qv), 30, 'liker_scale_5', 'Supervise the activities of children at a camp'),
((SELECT quiz_version_id FROM qv), 31, 'liker_scale_5', 'Teach children how to read'),
((SELECT quiz_version_id FROM qv), 32, 'liker_scale_5', 'Help elderly people with their daily activities'),

-- ENTERPRISING (E)
((SELECT quiz_version_id FROM qv), 33, 'liker_scale_5', 'Sell restaurant franchises to individuals'),
((SELECT quiz_version_id FROM qv), 34, 'liker_scale_5', 'Sell merchandise at a department store'),
((SELECT quiz_version_id FROM qv), 35, 'liker_scale_5', 'Manage the operations of a hotel'),
((SELECT quiz_version_id FROM qv), 36, 'liker_scale_5', 'Operate a beauty salon or barber shop'),
((SELECT quiz_version_id FROM qv), 37, 'liker_scale_5', 'Manage a department within a large company'),
((SELECT quiz_version_id FROM qv), 38, 'liker_scale_5', 'Manage a clothing store'),
((SELECT quiz_version_id FROM qv), 39, 'liker_scale_5', 'Sell houses'),
((SELECT quiz_version_id FROM qv), 40, 'liker_scale_5', 'Run a toy store'),

-- CONVENTIONAL (C)
((SELECT quiz_version_id FROM qv), 41, 'liker_scale_5', 'Generate the monthly payroll checks for an office'),
((SELECT quiz_version_id FROM qv), 42, 'liker_scale_5', 'Inventory supplies using a hand-held computer'),
((SELECT quiz_version_id FROM qv), 43, 'liker_scale_5', 'Use a computer program to generate customer bills'),
((SELECT quiz_version_id FROM qv), 44, 'liker_scale_5', 'Maintain employee records'),
((SELECT quiz_version_id FROM qv), 45, 'liker_scale_5', 'Compute and record statistical and other numerical data'),
((SELECT quiz_version_id FROM qv), 46, 'liker_scale_5', 'Operate a calculator'),
((SELECT quiz_version_id FROM qv), 47, 'liker_scale_5', 'Handle customers\ bank transactions'),
((SELECT quiz_version_id FROM qv), 48, 'liker_scale_5', 'Keep shipping and receiving records');

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
  (1, 'Dislike'),
  (2, 'Slightly dislike'),
  (3, 'Neutral'),
  (4, 'Enjoy'),
  (5, 'Strongly Enjoy')
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


------------------------------------------------------------
-- 6. Russian translations for all 48 questions
------------------------------------------------------------
DO $$
    DECLARE
        q RECORD;
        ru_text TEXT[];
    BEGIN
        -- Russian translations in order (R1..C8)
        ru_text := ARRAY[
            -- R (1–8)
            'Проверять качество деталей перед отправкой',
            'Класть кирпич или плитку',
            'Работать на морской нефтяной платформе',
            'Собирать электронные компоненты',
            'Работать на шлифовальном станке на фабрике',
            'Чинить сломанный кран',
            'Собирать изделия на производстве',
            'Укладывать напольное покрытие в домах',

            -- I (9–16)
            'Изучать строение человеческого тела',
            'Изучать поведение животных',
            'Проводить исследования растений или животных',
            'Разрабатывать новые медицинские процедуры',
            'Проводить биологические исследования',
            'Изучать китов и другую морскую жизнь',
            'Работать в биологической лаборатории',
            'Создавать карту дна океана',

            -- A (17–24)
            'Руководить музыкальным хором',
            'Режиссировать спектакль',
            'Создавать дизайн журналов',
            'Писать песню',
            'Писать книги или пьесы',
            'Играть на музыкальном инструменте',
            'Исполнять трюки для кино или телевидения',
            'Проектировать сценические декорации',

            -- S (25–32)
            'Давать карьерные советы людям',
            'Работать волонтером в некоммерческой организации',
            'Помогать людям с зависимостями',
            'Обучать человека тренировочной программе',
            'Помогать семьям решать проблемы',
            'Контролировать деятельность детей в лагере',
            'Учить детей читать',
            'Помогать пожилым людям с повседневными задачами',

            -- E (33–40)
            'Продавать франшизы ресторанов',
            'Продавать товары в универмаге',
            'Управлять работой отеля',
            'Работать в салоне красоты или барбершопе',
            'Руководить отделом в крупной компании',
            'Управлять магазином одежды',
            'Продавать дома',
            'Управлять магазином игрушек',

            -- C (41–48)
            'Выписывать ежемесячные платежные ведомости',
            'Проводить инвентаризацию через портативный компьютер',
            'Использовать программу для формирования счетов',
            'Вести кадровую документацию',
            'Записывать статистические данные',
            'Работать на калькуляторе',
            'Обслуживать банковские операции клиентов',
            'Вести учет отправлений и получений'
            ];

        FOR q IN
            SELECT id, ord
            FROM questions
            WHERE quiz_version_id = (SELECT id FROM quiz_versions WHERE quiz_id =
                                                                        (SELECT id FROM quizzes WHERE code='riasec_main') AND is_current=TRUE)
            ORDER BY ord
            LOOP
                INSERT INTO translations (entity_type, entity_id, locale, field, text)
                VALUES ('question', q.id, 'ru', 'text', ru_text[q.ord])
                ON CONFLICT DO NOTHING;
            END LOOP;
    END $$;

------------------------------------------------------------
-- 7. Russian translations for Likert answer options
------------------------------------------------------------

DO $$
    DECLARE
        opt RECORD;
        ru_labels TEXT[] := ARRAY[
            '1 — Нет',
            '2 — Скорее нет',
            '3 — Нейтрально',
            '4 — Скорее да',
            '5 — Да'
            ];
    BEGIN
        FOR opt IN
            SELECT id, ord
            FROM question_options
            WHERE question_id IN (
                SELECT id FROM questions
                WHERE quiz_version_id = (
                    SELECT id FROM quiz_versions
                    WHERE quiz_id = (SELECT id FROM quizzes WHERE code='riasec_main')
                      AND is_current = TRUE
                )
            )
            ORDER BY id
            LOOP
                INSERT INTO translations (entity_type, entity_id, locale, field, text)
                VALUES ('question_option', opt.id, 'ru', 'text', ru_labels[opt.ord])
                ON CONFLICT DO NOTHING;
            END LOOP;
    END $$;

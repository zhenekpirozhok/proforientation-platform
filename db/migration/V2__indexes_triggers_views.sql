-- Доп.ограничения, индексы, триггеры, представления

----------------------------------------------------------------------
-- Индексы
----------------------------------------------------------------------

-- Ускорение поиска профессий по категориям
CREATE INDEX idx_professions_category ON professions(category_id);

-- Формат кода профессии: строчные латинские буквы, цифры, подчеркивания
ALTER TABLE professions
  ADD CONSTRAINT chk_professions_code_format
  CHECK (code ~ '^[a-z0-9_]+$');

-- Ускорение поиска активных пользователей по ролям
CREATE INDEX idx_users_role_active
  ON users(role, is_active);

-- Ускорение сортировки пользователей по дате создания (при росте числа пользователей)
CREATE INDEX idx_users_created_at
  ON users(created_at DESC);

-- Ускорение поиска пользователей по e-mail (без учета регистра)
CREATE INDEX idx_users_email_lower
  ON users (lower(email));

-- Ускорение поиска квизов по статусу (для админки)
CREATE INDEX idx_quizzes_status
  ON quizzes(status);

-- Ускорение поиска по категории квизов
CREATE INDEX idx_quizzes_category
  ON quizzes(category_id);

-- Обеспечение уникальности текущей версии квиза
CREATE UNIQUE INDEX uq_quiz_versions_one_current
  ON quiz_versions(quiz_id)
  WHERE is_current;

-- Список версий одного квиза
CREATE INDEX idx_quiz_versions_quiz ON quiz_versions(quiz_id);

-- Список вопросов в версии квиза в нужном порядке  
CREATE INDEX idx_questions_quiz_version_ord
  ON questions(quiz_version_id, ord);

-- Список опций вопроса в нужном порядке
CREATE INDEX idx_question_options_question_ord
  ON question_options(question_id, ord);

-- Список вопросов, отвечающих за шкалы
CREATE INDEX idx_qot_trait ON question_option_traits(trait_id);

-- Аналитика по шкалам
CREATE INDEX idx_attempt_trait_scores_trait
  ON attempt_trait_scores(trait_id);

-- Быстрый поиск попытки по UUID
CREATE UNIQUE INDEX uq_attempts_uuid ON attempts(uuid);

-- Быстрый поиск попыток по версии квиза и дате отправки (для отчетов)
CREATE INDEX idx_attempts_quiz_version_submitted
  ON attempts(quiz_version_id, submitted_at);

-- Быстрый поиск попыток по пользователю и дате отправки (для отчетов)
CREATE INDEX idx_attempts_user_submitted
  ON attempts(user_id, submitted_at DESC);

-- Ответы: поиск всех ответов попытки
CREATE INDEX idx_answers_attempt ON answers(attempt_id);

-- Рекомендации по попыткам
CREATE INDEX idx_ar_attempt ON attempt_recommendations(attempt_id);
CREATE INDEX idx_ar_profession ON attempt_recommendations(profession_id);

-- Переводы по сущности
CREATE INDEX idx_translations_entity ON translations(entity_type, entity_id);

----------------------------------------------------------------------
-- Дополнительные CHECK-ограничения
----------------------------------------------------------------------

-- Уникальность ответов на конкретный вариант в пределах попытки
ALTER TABLE answers
  ADD CONSTRAINT uq_answers_attempt_option
  UNIQUE (attempt_id, option_id);

-- Формат e-mail в таблице users
ALTER TABLE users
  ADD CONSTRAINT chk_users_email_format
  CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$');

-- Проверка, что текущая версия опубликована
ALTER TABLE quiz_versions
  ADD CONSTRAINT chk_quiz_versions_current_published
  CHECK (
    NOT is_current OR published_at IS NOT NULL
  );

-- Версия квиза должна быть натуральным числом
ALTER TABLE quiz_versions
  ADD CONSTRAINT chk_quiz_versions_version_positive
  CHECK (version > 0);

-- Порядковый номер вопросов в пределах версии квиза должен быть уникален и положителен
ALTER TABLE questions
  ADD CONSTRAINT uq_questions_quiz_version_ord
  UNIQUE (quiz_version_id, ord);

ALTER TABLE questions
  ADD CONSTRAINT chk_questions_ord_positive
  CHECK (ord > 0);

-- Порядковый номер опций в пределах вопроса должен быть уникален и положителен
ALTER TABLE question_options
  ADD CONSTRAINT uq_question_options_question_ord
  UNIQUE (question_id, ord);

ALTER TABLE question_options
  ADD CONSTRAINT chk_question_options_ord_positive
  CHECK (ord > 0);

-- Трейт не может быть парой сам с собой
ALTER TABLE trait_profiles
  ADD CONSTRAINT chk_trait_not_pair_to_self
  CHECK (bipolar_pair_code IS NULL OR bipolar_pair_code <> code);

-- Временные метки попыток: submitted_at >= started_at
ALTER TABLE attempts
  ADD CONSTRAINT chk_attempts_time_order
  CHECK (submitted_at IS NULL OR submitted_at >= started_at);

-- Ограничение на 0–1 в attempt_trait_scores
ALTER TABLE attempt_trait_scores
  ADD CONSTRAINT chk_attempt_trait_scores_0_1
  CHECK (score >= 0 AND score <= 1);


----------------------------------------------------------------------
-- Функция пересчёта трейтов для одной попытки
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION recalc_attempt_trait_scores(p_attempt_id bigint)
RETURNS void AS $$
DECLARE
  v_quiz_version_id bigint;
BEGIN
  -- 1. Какая версия квиза у попытки?
  SELECT quiz_version_id INTO v_quiz_version_id
  FROM attempts
  WHERE id = p_attempt_id;

  IF v_quiz_version_id IS NULL THEN
    RAISE EXCEPTION 'Attempt % not found', p_attempt_id;
  END IF;

  -- 2. Удаляем старые данные для этой попытки
  DELETE FROM attempt_trait_scores
  WHERE attempt_id = p_attempt_id;

  -- 3. Считаем фактические + максимальные баллы и вставляем долю 0..1
  WITH actual AS (
    -- Сумма весов трейтов по ответам пользователя
    SELECT
      a.attempt_id,
      qot.trait_id,
      SUM(qot.weight) AS actual_score
    FROM answers a
    JOIN question_option_traits qot
      ON qot.question_option_id = a.option_id
    WHERE a.attempt_id = p_attempt_id
    GROUP BY a.attempt_id, qot.trait_id
  ),
  max_per_question AS (
    -- Максимальный вес трейта по каждому вопросу версии
    SELECT
      q.id AS question_id,
      qot.trait_id,
      MAX(qot.weight) AS max_weight
    FROM questions q
    JOIN question_options qo
      ON qo.question_id = q.id
    JOIN question_option_traits qot
      ON qot.question_option_id = qo.id
    WHERE q.quiz_version_id = v_quiz_version_id
    GROUP BY q.id, qot.trait_id
  ),
  max_scores AS (
    -- Максимальный общий балл по каждому трейту
    SELECT
      trait_id,
      SUM(max_weight) AS max_score
    FROM max_per_question
    GROUP BY trait_id
  )
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT
    a.attempt_id,
    a.trait_id,
    CASE
      WHEN m.max_score IS NULL OR m.max_score = 0 THEN 0
      ELSE ROUND(a.actual_score / m.max_score, 6)
    END AS score_norm -- значение от 0 до 1
  FROM actual a
  LEFT JOIN max_scores m USING (trait_id);

END;
$$ LANGUAGE plpgsql;


----------------------------------------------------------------------
-- Триггер: выполняем расчёт только при завершении попытки
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_set_attempt_trait_scores_on_submit()
RETURNS trigger AS $$
BEGIN
  -- Вставка сразу завершённой попытки
  IF TG_OP = 'INSERT' AND NEW.submitted_at IS NOT NULL THEN
    PERFORM recalc_attempt_trait_scores(NEW.id);
    RETURN NEW;
  END IF;

  -- Обновление: было NULL → стало NOT NULL
  IF TG_OP = 'UPDATE'
     AND OLD.submitted_at IS NULL
     AND NEW.submitted_at IS NOT NULL
  THEN
    PERFORM recalc_attempt_trait_scores(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_set_attempt_trait_scores_on_submit
AFTER INSERT OR UPDATE OF submitted_at ON attempts
FOR EACH ROW
EXECUTE FUNCTION trg_set_attempt_trait_scores_on_submit();


----------------------------------------------------------------------
-- Триггер: приведение e-mail к нижнему регистру
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION normalize_user_email()
RETURNS trigger AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_email_normalize
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION normalize_user_email();

----------------------------------------------------------------------
-- Триггер: опция должна относиться к тому же квизу, что и попытка
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION chk_answer_option_belongs_to_question()
RETURNS trigger AS $$
BEGIN
  -- Проверяем, что option_id принадлежит вопросу из той же версии квиза, что и попытка
  PERFORM 1
  FROM attempts a
  JOIN quiz_versions qv ON qv.id = a.quiz_version_id
  JOIN questions q      ON q.quiz_version_id = qv.id
  JOIN question_options qo ON qo.question_id = q.id
  WHERE a.id = NEW.attempt_id
    AND qo.id = NEW.option_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Option % does not belong to quiz version of attempt %',
      NEW.option_id, NEW.attempt_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_answers_option_check
BEFORE INSERT OR UPDATE ON answers
FOR EACH ROW
EXECUTE FUNCTION chk_answer_option_belongs_to_question();

----------------------------------------------------------------------
-- Общая функция updated_at + триггеры
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_quizzes_updated
BEFORE UPDATE ON quizzes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

----------------------------------------------------------------------
-- VIEW: подробные результаты по трейтам
----------------------------------------------------------------------

CREATE OR REPLACE VIEW v_attempt_trait_scores AS
SELECT
  a.id           AS attempt_id,
  a.uuid         AS attempt_uuid,
  q.code         AS quiz_code,
  t.id           AS trait_id,
  t.code         AS trait_code,
  t.name         AS trait_name,
  ats.score
FROM attempt_trait_scores ats
JOIN attempts a       ON a.id = ats.attempt_id
JOIN trait_profiles t ON t.id = ats.trait_id
JOIN quiz_versions qv ON qv.id = a.quiz_version_id
JOIN quizzes q        ON q.id = qv.quiz_id;

----------------------------------------------------------------------
-- VIEW: попытки и рекомендованные профессии
----------------------------------------------------------------------

CREATE OR REPLACE VIEW v_attempt_recommendations AS
SELECT
  a.id              AS attempt_id,
  a.uuid            AS attempt_uuid,
  q.code            AS quiz_code,
  u.email           AS user_email,
  a.guest_token,
  p.id              AS profession_id,
  p.code            AS profession_code,
  p.title_default   AS profession_title,
  ar.score,
  ar.llm_explanation
FROM attempts a
JOIN quiz_versions qv ON qv.id = a.quiz_version_id
JOIN quizzes q        ON q.id = qv.quiz_id
LEFT JOIN users u     ON u.id = a.user_id
JOIN attempt_recommendations ar ON ar.attempt_id = a.id
JOIN professions p              ON p.id = ar.profession_id;

----------------------------------------------------------------------
-- VIEW: общий обзор попыток
----------------------------------------------------------------------

CREATE OR REPLACE VIEW v_attempts_overview AS
SELECT
  a.id                    AS attempt_id,
  a.uuid                  AS attempt_uuid,
  a.started_at,
  a.submitted_at,
  a.locale,
  (a.submitted_at - a.started_at) AS duration,
  a.user_id,
  u.email                 AS user_email,
  a.guest_token,
  q.id                    AS quiz_id,
  q.code                  AS quiz_code,
  q.title_default         AS quiz_title,
  qv.id                   AS quiz_version_id,
  qv.version              AS quiz_version,
  q.status                AS quiz_status
FROM attempts a
JOIN quiz_versions qv ON qv.id = a.quiz_version_id
JOIN quizzes q        ON q.id = qv.quiz_id
LEFT JOIN users u      ON u.id = a.user_id;

----------------------------------------------------------------------
-- VIEW: простая агрегированная статистика по квизам
----------------------------------------------------------------------

CREATE OR REPLACE VIEW v_quiz_attempts_stats AS
SELECT
  q.id            AS quiz_id,
  q.code          AS quiz_code,
  q.title_default AS quiz_title,
  count(a.id)     AS attempts_total,
  count(a.submitted_at) AS attempts_submitted,
  min(a.started_at)     AS first_attempt_at,
  max(a.started_at)     AS last_attempt_at
FROM quizzes q
LEFT JOIN quiz_versions qv ON qv.quiz_id = q.id AND qv.is_current = TRUE
LEFT JOIN attempts a       ON a.quiz_version_id = qv.id
GROUP BY q.id, q.code, q.title_default;


----------------------------------------------------------------------
-- VIEW: пользователи с замаскированными e-mail
----------------------------------------------------------------------
CREATE OR REPLACE VIEW v_users_masked AS
SELECT
  id,
  -- первая буква + *** + домен
  CASE
    WHEN email IS NULL THEN NULL
    ELSE regexp_replace(email, '(^.).*(@.*$)', '\1***\2')
  END AS email_masked,
  display_name,
  role,
  is_active,
  created_at,
  updated_at
FROM users;


----------------------------------------------------------------------
-- VIEW: попытки с замаскированными e-mail и guest_token
----------------------------------------------------------------------
CREATE OR REPLACE VIEW v_attempts_overview_masked AS
SELECT
  a.id                    AS attempt_id,
  a.uuid                  AS attempt_uuid,
  a.started_at,
  a.submitted_at,
  a.locale,
  (a.submitted_at - a.started_at) AS duration,
  a.user_id,
  CASE
    WHEN u.email IS NULL THEN NULL
    ELSE regexp_replace(u.email, '(^.).*(@.*$)', '\1***\2')
  END AS user_email_masked,
  CASE
    WHEN a.guest_token IS NULL THEN NULL
    ELSE substr(a.guest_token, 1, 4) || '***'
  END AS guest_token_masked,
  q.id                    AS quiz_id,
  q.code                  AS quiz_code,
  q.title_default         AS quiz_title,
  qv.id                   AS quiz_version_id,
  qv.version              AS quiz_version,
  q.status                AS quiz_status
FROM attempts a
JOIN quiz_versions qv ON qv.id = a.quiz_version_id
JOIN quizzes q        ON q.id = qv.quiz_id
LEFT JOIN users u      ON u.id = a.user_id;

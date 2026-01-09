-- Additional constraints, indexes, triggers, views

----------------------------------------------------------------------
-- Indexes
----------------------------------------------------------------------

-- Speed up searching professions by category
CREATE INDEX idx_professions_category ON professions(category_id);

-- Speed up searching active users by roles
CREATE INDEX idx_users_role_active
  ON users(role, is_active);

-- Speed up sorting users by creation date (for large user base)
CREATE INDEX idx_users_created_at
  ON users(created_at DESC);

-- Speed up searching users by email (case-insensitive)
CREATE INDEX idx_users_email_lower
  ON users (lower(email));

-- Speed up searching quizzes by status (for admin panel)
CREATE INDEX idx_quizzes_status
  ON quizzes(status);

-- Speed up searching quizzes by category
CREATE INDEX idx_quizzes_category
  ON quizzes(category_id);

-- Ensure uniqueness of current quiz version
CREATE UNIQUE INDEX uq_quiz_versions_one_current
  ON quiz_versions(quiz_id)
  WHERE is_current;

-- List of all versions of a single quiz
CREATE INDEX idx_quiz_versions_quiz ON quiz_versions(quiz_id);

-- List of questions in a quiz version in correct order
CREATE INDEX idx_questions_quiz_version_ord
  ON questions(quiz_version_id, ord);

-- List of options of a question in correct order
CREATE INDEX idx_question_options_question_ord
  ON question_options(question_id, ord);

-- List of questions contributing to trait scores
CREATE INDEX idx_qot_trait ON question_option_traits(trait_id);

-- Analytics on trait scores
CREATE INDEX idx_attempt_trait_scores_trait
  ON attempt_trait_scores(trait_id);

-- Fast lookup of attempts by UUID
CREATE UNIQUE INDEX uq_attempts_uuid ON attempts(uuid);

-- Fast lookup of attempts by quiz version and submission date (for reporting)
CREATE INDEX idx_attempts_quiz_version_submitted
  ON attempts(quiz_version_id, submitted_at);

-- Fast lookup of attempts by user and submission date (for reporting)
CREATE INDEX idx_attempts_user_submitted
  ON attempts(user_id, submitted_at DESC);

-- Answers: lookup all answers for an attempt
CREATE INDEX idx_answers_attempt ON answers(attempt_id);

-- Recommendations per attempt
CREATE INDEX idx_ar_attempt ON attempt_recommendations(attempt_id);
CREATE INDEX idx_ar_profession ON attempt_recommendations(profession_id);

-- Translations per entity
CREATE INDEX idx_translations_entity_locale
  ON translations (entity_type, entity_id, locale);

-- Index to speed up lookup by user id
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id
    ON password_reset(user_id);

-- Index to quickly clean/remove expired tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_expiry
    ON password_reset(expiry_date);

----------------------------------------------------------------------
-- Additional CHECK constraints
----------------------------------------------------------------------

-- Uniqueness of answers for a specific option within an attempt
ALTER TABLE answers
  ADD CONSTRAINT uq_answers_attempt_option
  UNIQUE (attempt_id, option_id);

-- Ensure that the current version is published
ALTER TABLE quiz_versions
  ADD CONSTRAINT chk_quiz_versions_current_published
  CHECK (
    NOT is_current OR published_at IS NOT NULL
  );

-- Quiz version must be a natural number
ALTER TABLE quiz_versions
  ADD CONSTRAINT chk_quiz_versions_version_positive
  CHECK (version > 0);

-- Question order within a quiz version must be unique and positive
ALTER TABLE questions
  ADD CONSTRAINT uq_questions_quiz_version_ord
  UNIQUE (quiz_version_id, ord);

ALTER TABLE questions
  ADD CONSTRAINT chk_questions_ord_positive
  CHECK (ord > 0);

-- Option order within a question must be unique and positive
ALTER TABLE question_options
  ADD CONSTRAINT uq_question_options_question_ord
  UNIQUE (question_id, ord);

ALTER TABLE question_options
  ADD CONSTRAINT chk_question_options_ord_positive
  CHECK (ord > 0);

-- A trait cannot be paired with itself
ALTER TABLE trait_profiles
  ADD CONSTRAINT chk_trait_not_pair_to_self
  CHECK (bipolar_pair_code IS NULL OR bipolar_pair_code <> code);

-- Attempt timestamps: submitted_at >= started_at
ALTER TABLE attempts
  ADD CONSTRAINT chk_attempts_time_order
  CHECK (submitted_at IS NULL OR submitted_at >= started_at);

----------------------------------------------------------------------
-- Function to recalculate trait scores for a single attempt
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION recalc_attempt_trait_scores(p_attempt_id bigint)
RETURNS void AS $$
DECLARE
  v_quiz_version_id bigint;
BEGIN
    -- 1. Determine which quiz version the attempt belongs to
  SELECT quiz_version_id INTO v_quiz_version_id
  FROM attempts
  WHERE id = p_attempt_id;

  IF v_quiz_version_id IS NULL THEN
    RAISE EXCEPTION 'Attempt % not found', p_attempt_id;
  END IF;

    -- 2. Remove old trait data for this attempt
    DELETE FROM attempt_trait_scores
  WHERE attempt_id = p_attempt_id;

   WITH actual AS (
    -- Sum of trait weights based on user answers
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
    -- Maximum trait weight per question in the version
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
    -- Maximum total score per trait
    SELECT
      trait_id,
      SUM(max_weight) AS max_score
    FROM max_per_question
    GROUP BY trait_id
  )
  INSERT INTO attempt_trait_scores (attempt_id, trait_id, score)
  SELECT
    p_attempt_id,
    m.trait_id,
    CASE
      WHEN m.max_score = 0 THEN 0
      ELSE ROUND(COALESCE(a.actual_score, 0) / m.max_score, 6)
    END AS score_norm
  FROM max_scores m
  LEFT JOIN actual a USING (trait_id);

END;
$$ LANGUAGE plpgsql;


----------------------------------------------------------------------
-- Trigger: calculate only when attempt is completed
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_set_attempt_trait_scores_on_submit()
RETURNS trigger AS $$
BEGIN
    -- Insertion of an already completed attempt
  IF TG_OP = 'INSERT' AND NEW.submitted_at IS NOT NULL THEN
    PERFORM recalc_attempt_trait_scores(NEW.id);
    RETURN NEW;
  END IF;

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
-- Trigger: option must belong to the same quiz as the attempt
----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION chk_answer_option_belongs_to_question()
RETURNS trigger AS $$
BEGIN
    -- Ensure that option_id belongs to a question from the same quiz version as the attempt
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
-- General updated_at function + triggers
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
-- VIEW: detailed trait results
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
-- VIEW: attempts and recommended professions
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
-- VIEW: overall attempt overview
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
-- VIEW: simple aggregated quiz statistics
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
-- VIEW: users with masked emails
----------------------------------------------------------------------
CREATE OR REPLACE VIEW v_users_masked AS
SELECT
  id,
  -- first letter + *** + domain
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
-- VIEW: attempts with masked emails and guest_token
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

----------------------------------------------------------------------
-- VIEW: translations for entities
----------------------------------------------------------------------

CREATE VIEW questions_ru AS
SELECT
    q.id,
    q.quiz_version_id,
    q.ord,
    q.qtype,
    COALESCE(t.text, q.text_default) AS text
FROM questions q
LEFT JOIN translations t
    ON t.entity_type = 'question'
   AND t.entity_id   = q.id
   AND t.field       = 'text'
   AND t.locale      = 'ru';

CREATE VIEW question_options_ru AS
SELECT
    qo.id,
    qo.question_id,
    qo.ord,
    COALESCE(t.text, qo.label_default) AS label
FROM question_options qo
LEFT JOIN translations t
    ON t.entity_type = 'question_option'
   AND t.entity_id   = qo.id
   AND t.field       = 'label'
   AND t.locale      = 'ru';

CREATE OR REPLACE VIEW professions_ru AS
SELECT
    p.id,
    p.code,
    COALESCE(t.text, p.title_default) AS title,
    COALESCE(t2.text, p.description)  AS description
FROM professions p
LEFT JOIN translations t
    ON t.entity_type = 'profession'
   AND t.entity_id   = p.id
   AND t.field       = 'title'
   AND t.locale      = 'ru'
LEFT JOIN translations t2
    ON t2.entity_type = 'profession'
   AND t2.entity_id   = p.id
   AND t2.field       = 'description'
   AND t2.locale      = 'ru';

CREATE OR REPLACE VIEW quizzes_ru AS
SELECT
    q.id,
    q.code,
    COALESCE(t.text, q.title_default) AS title
FROM quizzes q
LEFT JOIN translations t
    ON t.entity_type = 'quiz'
   AND t.entity_id   = q.id
   AND t.field       = 'title'
   AND t.locale      = 'ru';


CREATE OR REPLACE VIEW quizzes_en AS
SELECT
    q.id,
    q.code,
    COALESCE(t.text, q.title_default) AS title
FROM quizzes q
LEFT JOIN translations t
    ON t.entity_type = 'quiz'
   AND t.entity_id   = q.id
   AND t.field       = 'title'
   AND t.locale      = 'en';

CREATE OR REPLACE VIEW professions_en AS
SELECT
    p.id,
    p.code,
    COALESCE(t.text, p.title_default) AS title,
    COALESCE(t2.text, p.description)  AS description
FROM professions p
LEFT JOIN translations t
    ON t.entity_type = 'profession'
   AND t.entity_id   = p.id
   AND t.field       = 'title'
   AND t.locale      = 'en'
LEFT JOIN translations t2
    ON t2.entity_type = 'profession'
   AND t2.entity_id   = p.id
   AND t2.field       = 'description'
   AND t2.locale      = 'en';

CREATE VIEW question_options_en AS
SELECT
    qo.id,
    qo.question_id,
    qo.ord,
    COALESCE(t.text, qo.label_default) AS label
FROM question_options qo
LEFT JOIN translations t
    ON t.entity_type = 'question_option'
   AND t.entity_id   = qo.id
   AND t.field       = 'label'
   AND t.locale      = 'en';

CREATE VIEW questions_en AS
SELECT
    q.id,
    q.quiz_version_id,
    q.ord,
    q.qtype,
    COALESCE(t.text, q.text_default) AS text
FROM questions q
LEFT JOIN translations t
    ON t.entity_type = 'question'
   AND t.entity_id   = q.id
   AND t.field       = 'text'
   AND t.locale      = 'en';

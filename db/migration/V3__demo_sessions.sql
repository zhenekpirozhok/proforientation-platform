-- V3__demo_sessions.sql
-- Demo sessions and answers to showcase how test flow works.
-- Assumes V1__init_schema.sql and V2__test_data.sql were applied.

-- Completed session for Alice with a "Yes" answer.
WITH
  t AS (SELECT id AS test_id FROM tests ORDER BY id LIMIT 1),
  alice AS (SELECT id AS user_id FROM users WHERE email = 'alice@example.com' LIMIT 1),
  q AS (
    SELECT q.id AS question_id, q.answer_option_set_id
    FROM questions q
    WHERE q.test_id = (SELECT test_id FROM t)
    ORDER BY q.id
    LIMIT 1
  ),
  yes_opt AS (
    SELECT ao.id AS option_id
    FROM answer_options ao
    JOIN answer_options_t aot ON aot.option_id = ao.id
    WHERE aot.lang = 'en' AND aot.text_t = 'Yes'
    LIMIT 1
  ),
  s AS (
    INSERT INTO test_sessions (user_id, test_id, started_at, completed_at, status)
    SELECT
      (SELECT user_id FROM alice),
      (SELECT test_id FROM t),
      now() - interval '15 minutes',
      now() - interval '10 minutes',
      'completed'
    RETURNING id AS session_id
  )
INSERT INTO test_answers (test_session_id, question_id, answer_option_id)
SELECT
  (SELECT session_id FROM s),
  (SELECT question_id FROM q),
  (SELECT option_id FROM yes_opt);


-- In-progress session for Bob with no answers yet.
WITH
  t AS (SELECT id AS test_id FROM tests ORDER BY id LIMIT 1),
  bob AS (SELECT id AS user_id FROM users WHERE email = 'bob@example.com' LIMIT 1)
INSERT INTO test_sessions (user_id, test_id, started_at, status)
SELECT
  (SELECT user_id FROM bob),
  (SELECT test_id FROM t),
  now() - interval '5 minutes',
  'in_progress';


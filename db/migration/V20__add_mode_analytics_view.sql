DROP VIEW IF EXISTS v_quiz_question_avg_choice;


CREATE OR REPLACE VIEW v_quiz_question_mode_choice AS
WITH base AS (
    SELECT
        qz.id AS quiz_id,
        qv.id AS quiz_version_id,
        qu.id AS question_id,
        qu.ord AS question_ord,
        qo.ord AS option_ord
    FROM answers a
             JOIN attempts at
                  ON at.id = a.attempt_id
                      AND at.submitted_at IS NOT NULL
             JOIN quiz_versions qv ON qv.id = at.quiz_version_id
             JOIN quizzes qz ON qz.id = qv.quiz_id
             JOIN question_options qo ON qo.id = a.option_id
             JOIN questions qu
                  ON qu.id = qo.question_id
                      AND qu.quiz_version_id = qv.id
),
     counts AS (
         SELECT
             quiz_id,
             quiz_version_id,
             question_id,
             question_ord,
             option_ord,
             COUNT(*)::int AS cnt
         FROM base
         GROUP BY quiz_id, quiz_version_id, question_id, question_ord, option_ord
     ),
     ranked AS (
         SELECT
             *,
             ROW_NUMBER() OVER (
                 PARTITION BY quiz_id, quiz_version_id, question_id
                 ORDER BY cnt DESC, option_ord ASC
                 ) AS rn,
             SUM(cnt) OVER (
                 PARTITION BY quiz_id, quiz_version_id, question_id
                 )::int AS answers_count
         FROM counts
     )
SELECT
    quiz_id,
    quiz_version_id,
    question_id,
    question_ord,
    option_ord AS mode_choice,
    cnt AS mode_count,
    answers_count
FROM ranked
WHERE rn = 1;

CREATE OR REPLACE VIEW v_quiz_activity_daily AS
SELECT
    q.id AS quiz_id,
    qv.id AS quiz_version_id,
    date_trunc('day', a.started_at)::date AS day,
    COUNT(a.id)::int AS attempts_started,
    COUNT(a.submitted_at)::int AS attempts_completed,
    AVG(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))) AS avg_duration_seconds
FROM quizzes q
         JOIN quiz_versions qv ON qv.quiz_id = q.id AND qv.is_current = TRUE
         LEFT JOIN attempts a ON a.quiz_version_id = qv.id
GROUP BY q.id, qv.id, date_trunc('day', a.started_at)::date;


CREATE INDEX IF NOT EXISTS idx_attempts_quiz_version_started
    ON attempts(quiz_version_id, started_at);


CREATE OR REPLACE VIEW v_quiz_top_professions AS
WITH ranked AS (
    SELECT
        q.id  AS quiz_id,
        qv.id AS quiz_version_id,

        ar.attempt_id,
        ar.profession_id,
        p.title_default AS profession_title,
        ar.score,

        ROW_NUMBER() OVER (
            PARTITION BY ar.attempt_id
            ORDER BY ar.score DESC
            ) AS rn

    FROM attempt_recommendations ar
             JOIN attempts a
                  ON a.id = ar.attempt_id
                      AND a.submitted_at IS NOT NULL
             JOIN quiz_versions qv
                  ON qv.id = a.quiz_version_id
             JOIN quizzes q
                  ON q.id = qv.quiz_id
             JOIN professions p
                  ON p.id = ar.profession_id
)

SELECT
    quiz_id,
    quiz_version_id,
    profession_id,
    profession_title,
    COUNT(*)::int AS top1_count

FROM ranked
WHERE rn = 1

GROUP BY
    quiz_id,
    quiz_version_id,
    profession_id,
    profession_title

ORDER BY
    quiz_id,
    quiz_version_id,
    top1_count DESC;


CREATE OR REPLACE VIEW v_quiz_funnel_overview AS
SELECT
    q.id AS quiz_id,
    qv.id AS quiz_version_id,

    COUNT(a.id)::int AS attempts_started,
    COUNT(a.submitted_at)::int AS attempts_completed,

    CASE
        WHEN COUNT(a.id) = 0 THEN 0
        ELSE ROUND((COUNT(a.submitted_at)::numeric / COUNT(a.id)::numeric), 6)
        END AS completion_rate,

    AVG(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at)))
    FILTER (WHERE a.submitted_at IS NOT NULL) AS avg_duration_seconds

FROM quizzes q
         JOIN quiz_versions qv ON qv.quiz_id = q.id
         LEFT JOIN attempts a ON a.quiz_version_id = qv.id
GROUP BY q.id, qv.id;


CREATE OR REPLACE VIEW v_quiz_question_avg_choice AS
SELECT
    qz.id AS quiz_id,
    qv.id AS quiz_version_id,

    qu.id AS question_id,
    qu.ord AS question_ord,

    AVG(qo.ord)::numeric(10,4) AS avg_choice,
    COUNT(*)::int AS answers_count

FROM answers a
         JOIN attempts at
              ON at.id = a.attempt_id
                  AND at.submitted_at IS NOT NULL
         JOIN quiz_versions qv
              ON qv.id = at.quiz_version_id
         JOIN quizzes qz
              ON qz.id = qv.quiz_id
         JOIN question_options qo
              ON qo.id = a.option_id
         JOIN questions qu
              ON qu.id = qo.question_id
                  AND qu.quiz_version_id = qv.id
GROUP BY qz.id, qv.id, qu.id, qu.ord;


CREATE OR REPLACE VIEW v_quiz_question_option_distribution AS
SELECT
    qz.id AS quiz_id,
    qv.id AS quiz_version_id,

    qu.id AS question_id,
    qu.ord AS question_ord,

    qo.id AS option_id,
    qo.ord AS option_ord,

    COUNT(*)::int AS cnt

FROM answers a
         JOIN attempts at
              ON at.id = a.attempt_id
                  AND at.submitted_at IS NOT NULL
         JOIN quiz_versions qv
              ON qv.id = at.quiz_version_id
         JOIN quizzes qz
              ON qz.id = qv.quiz_id
         JOIN question_options qo
              ON qo.id = a.option_id
         JOIN questions qu
              ON qu.id = qo.question_id
                  AND qu.quiz_version_id = qv.id
GROUP BY qz.id, qv.id, qu.id, qu.ord, qo.id, qo.ord;


CREATE OR REPLACE VIEW v_quiz_question_discrimination_norm_all AS
WITH versions AS (
    SELECT
        qv.id     AS quiz_version_id,
        qv.quiz_id
    FROM quiz_versions qv
),

-- total trait score per attempt (for ranking attempts) per version
     attempt_totals AS (
         SELECT
             v.quiz_id,
             v.quiz_version_id,
             a.id AS attempt_id,
             COALESCE(SUM(ats.score), 0)::numeric AS total_score
         FROM versions v
                  JOIN attempts a
                       ON a.quiz_version_id = v.quiz_version_id
                           AND a.submitted_at IS NOT NULL
                  LEFT JOIN attempt_trait_scores ats
                            ON ats.attempt_id = a.id
         GROUP BY v.quiz_id, v.quiz_version_id, a.id
     ),

     ranked AS (
         SELECT
             quiz_id,
             quiz_version_id,
             attempt_id,
             total_score,
             percent_rank() OVER (PARTITION BY quiz_version_id ORDER BY total_score) AS pr,
             count(*)       OVER (PARTITION BY quiz_version_id) AS attempts_submitted
         FROM attempt_totals
     ),

     bucketed AS (
         SELECT
             quiz_id,
             quiz_version_id,
             attempt_id,
             attempts_submitted,
             CASE
                 WHEN pr <= 0.27 THEN 'bottom'
                 WHEN pr >= 0.73 THEN 'top'
                 ELSE NULL
                 END AS bucket
         FROM ranked
     ),

-- answers mapped to chosen option ord
     answers_scored AS (
         SELECT
             b.quiz_id,
             b.quiz_version_id,
             b.attempts_submitted,
             b.bucket,
             qu.id  AS question_id,
             qu.ord AS question_ord,
             qo.ord::numeric AS chosen_ord
         FROM bucketed b
                  JOIN answers a
                       ON a.attempt_id = b.attempt_id
                  JOIN question_options qo
                       ON qo.id = a.option_id
                  JOIN questions qu
                       ON qu.id = qo.question_id
                           AND qu.quiz_version_id = b.quiz_version_id
         WHERE b.bucket IS NOT NULL
     ),

-- min/max ord per question to normalize into [-1..+1]
     question_ord_range AS (
         SELECT
             qu.quiz_version_id,
             qu.id AS question_id,
             MIN(qo.ord)::numeric AS min_ord,
             MAX(qo.ord)::numeric AS max_ord
         FROM questions qu
                  JOIN question_options qo
                       ON qo.question_id = qu.id
         GROUP BY qu.quiz_version_id, qu.id
     ),

     bucket_avgs AS (
         SELECT
             quiz_id,
             quiz_version_id,
             question_id,
             MAX(attempts_submitted) AS attempts_submitted,
             COUNT(*) FILTER (WHERE bucket = 'top')    AS answers_top,
             COUNT(*) FILTER (WHERE bucket = 'bottom') AS answers_bottom,
             AVG(chosen_ord) FILTER (WHERE bucket = 'top')    AS top_avg_ord,
             AVG(chosen_ord) FILTER (WHERE bucket = 'bottom') AS bottom_avg_ord
         FROM answers_scored
         GROUP BY quiz_id, quiz_version_id, question_id
     )

SELECT
    ba.quiz_id,
    ba.quiz_version_id,
    ba.question_id,

    qor.min_ord,
    qor.max_ord,

    ba.attempts_submitted,
    ba.answers_top,
    ba.answers_bottom,
    ba.top_avg_ord,
    ba.bottom_avg_ord,

    (ba.top_avg_ord - ba.bottom_avg_ord) AS disc_raw,

    CASE
        WHEN (qor.max_ord - qor.min_ord) = 0 THEN NULL
        WHEN ba.top_avg_ord IS NULL OR ba.bottom_avg_ord IS NULL THEN NULL
        ELSE ROUND(
                (ba.top_avg_ord - ba.bottom_avg_ord) / (qor.max_ord - qor.min_ord),
                6
             )
        END AS disc_norm,

    CASE
        WHEN ba.attempts_submitted < 30 THEN 'low_sample'
        WHEN (qor.max_ord - qor.min_ord) = 0 THEN 'no_scale_range'
        WHEN ba.top_avg_ord IS NULL OR ba.bottom_avg_ord IS NULL THEN 'missing_bucket_data'
        WHEN ((ba.top_avg_ord - ba.bottom_avg_ord) / NULLIF((qor.max_ord - qor.min_ord),0)) < 0 THEN 'reverse_discrimination'
        WHEN ((ba.top_avg_ord - ba.bottom_avg_ord) / NULLIF((qor.max_ord - qor.min_ord),0)) < 0.15 THEN 'weak'
        WHEN ((ba.top_avg_ord - ba.bottom_avg_ord) / NULLIF((qor.max_ord - qor.min_ord),0)) < 0.30 THEN 'ok'
        ELSE 'good'
        END AS disc_quality

FROM bucket_avgs ba
         JOIN question_ord_range qor
              ON qor.quiz_version_id = ba.quiz_version_id
                  AND qor.question_id     = ba.question_id;

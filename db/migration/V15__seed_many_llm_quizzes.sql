DO $$
DECLARE
  v_author_id INT;
  v_target_total INT := 30;
  v_created_total INT := 0;

  cat RECORD;
  i INT;

  v_quiz_id INT;
  v_quiz_code TEXT;
  v_title TEXT;
  v_desc  TEXT;

  v_qv_id INT;

  -- trait ids
  t_act INT;
  t_ana INT;
  t_cre INT;
  t_str INT;
  t_soc INT;
  t_aut INT;

  qid INT;
  opt_id INT;

  -- question texts (generic, short, human-readable)
  q_text TEXT[];
BEGIN
  --------------------------------------------------------------------
  -- 0) Find author (fallback to first user)
  --------------------------------------------------------------------
  SELECT id INTO v_author_id
  FROM users
  WHERE email = 'ya.kavalchuk@gmail.com'
  LIMIT 1;

  IF v_author_id IS NULL THEN
    SELECT id INTO v_author_id
    FROM users
    ORDER BY id
    LIMIT 1;
  END IF;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'No users found. Seed users first (author is required).';
  END IF;

  --------------------------------------------------------------------
  -- 1) Ensure demo traits exist (idempotent)
  --------------------------------------------------------------------
  INSERT INTO trait_profiles (code, name, description)
  VALUES
    ('ACT', 'Ориентация на действие', 'Быстро переходите от идей к действиям.'),
    ('ANA', 'Аналитический подход',  'Сначала разбираетесь в деталях и вариантах.'),
    ('CRE', 'Креативное мышление',   'Ищете нестандартные решения.'),
    ('STR', 'Структурность',         'Любите понятные правила и процессы.'),
    ('SOC', 'Ориентация на людей',   'Важны общение и взаимодействие.'),
    ('AUT', 'Самостоятельность',     'Комфортнее работать автономно.')
  ON CONFLICT (code) DO NOTHING;

  SELECT id INTO t_act FROM trait_profiles WHERE code='ACT';
  SELECT id INTO t_ana FROM trait_profiles WHERE code='ANA';
  SELECT id INTO t_cre FROM trait_profiles WHERE code='CRE';
  SELECT id INTO t_str FROM trait_profiles WHERE code='STR';
  SELECT id INTO t_soc FROM trait_profiles WHERE code='SOC';
  SELECT id INTO t_aut FROM trait_profiles WHERE code='AUT';

  --------------------------------------------------------------------
  -- 2) Question templates
  --------------------------------------------------------------------
  q_text := ARRAY[
    'Когда задача новая, вы чаще…',
    'В работе вам комфортнее, когда…',
    'В команде вы обычно…',
    'Важнее всего для вас…'
  ];

  --------------------------------------------------------------------
  -- 3) Create up to 30 quizzes across categories
  --------------------------------------------------------------------
  FOR cat IN
    SELECT id, code, name
    FROM profession_categories
    ORDER BY id
  LOOP
    EXIT WHEN v_created_total >= v_target_total;

    -- how many quizzes per category (adjust if you want)
    FOR i IN 1..5 LOOP
      EXIT WHEN v_created_total >= v_target_total;

      v_quiz_code := 'llm_demo_' || cat.code || '_' || lpad(i::text, 2, '0');
      v_title := 'Мини-профиль (' || cat.name || ') #' || i::text;
      v_desc  := 'Короткий квиз из 4 вопросов. Результат объясняется LLM.';

      ----------------------------------------------------------------
      -- 3.1) Insert quiz if not exists
      ----------------------------------------------------------------
      INSERT INTO quizzes (
        code, title_default, description_default,
        status, processing_mode,
        category_id, author_id
      )
      VALUES (
        v_quiz_code, v_title, v_desc,
        'PUBLISHED', 'LLM',
        cat.id, v_author_id
      )
      ON CONFLICT (code) DO NOTHING;

      SELECT id INTO v_quiz_id
      FROM quizzes
      WHERE code = v_quiz_code;

      ----------------------------------------------------------------
      -- 3.2) Ensure version 1 exists; make it current safely
      ----------------------------------------------------------------
      INSERT INTO quiz_versions (quiz_id, version, is_current, published_at)
      VALUES (v_quiz_id, 1, FALSE, now())
      ON CONFLICT (quiz_id, version) DO NOTHING;

      -- make only version 1 current (respect your uq_quiz_versions_one_current)
      UPDATE quiz_versions
      SET is_current = FALSE
      WHERE quiz_id = v_quiz_id
        AND is_current = TRUE;

      UPDATE quiz_versions
      SET is_current = TRUE,
          published_at = COALESCE(published_at, now())
      WHERE quiz_id = v_quiz_id
        AND version = 1;

      SELECT id INTO v_qv_id
      FROM quiz_versions
      WHERE quiz_id = v_quiz_id AND version = 1;

      ----------------------------------------------------------------
      -- 3.3) If questions already exist for this version => skip content
      ----------------------------------------------------------------
      IF EXISTS (SELECT 1 FROM questions WHERE quiz_version_id = v_qv_id LIMIT 1) THEN
        v_created_total := v_created_total + 1;
        CONTINUE;
      END IF;

      ----------------------------------------------------------------
      -- 3.4) Insert 4 questions
      ----------------------------------------------------------------
      INSERT INTO questions (quiz_version_id, ord, qtype, text_default)
      VALUES
        (v_qv_id, 1, 'SINGLE_CHOICE', q_text[1]),
        (v_qv_id, 2, 'SINGLE_CHOICE', q_text[2]),
        (v_qv_id, 3, 'SINGLE_CHOICE', q_text[3]),
        (v_qv_id, 4, 'SINGLE_CHOICE', q_text[4]);

      ----------------------------------------------------------------
      -- 3.5) For each question: 4 options
      ----------------------------------------------------------------
      FOR qid IN
        SELECT id
        FROM questions
        WHERE quiz_version_id = v_qv_id
        ORDER BY ord
      LOOP
        INSERT INTO question_options (question_id, ord, label_default)
        VALUES
          (qid, 1, 'Действовать сразу'),
          (qid, 2, 'Сначала разобраться'),
          (qid, 3, 'Найти нестандартный ход'),
          (qid, 4, 'Сделать по плану');
      END LOOP;

      ----------------------------------------------------------------
      -- 3.6) Map options -> traits (so attempt_trait_scores can be computed)
      --      We map by option ord consistently:
      --      1 -> ACT, 2 -> ANA, 3 -> CRE, 4 -> STR
      --      Plus: for question 3 and 4 we swap in SOC/AUT to diversify.
      ----------------------------------------------------------------
      -- Q1, Q2: ACT/ANA/CRE/STR
      INSERT INTO question_option_traits (question_option_id, trait_id, weight)
      SELECT qo.id,
             CASE qo.ord
               WHEN 1 THEN t_act
               WHEN 2 THEN t_ana
               WHEN 3 THEN t_cre
               WHEN 4 THEN t_str
             END,
             1.0
      FROM question_options qo
      JOIN questions q ON q.id = qo.question_id
      WHERE q.quiz_version_id = v_qv_id
        AND q.ord IN (1,2);

      -- Q3: 1->SOC, 2->AUT, 3->CRE, 4->STR
      INSERT INTO question_option_traits (question_option_id, trait_id, weight)
      SELECT qo.id,
             CASE qo.ord
               WHEN 1 THEN t_soc
               WHEN 2 THEN t_aut
               WHEN 3 THEN t_cre
               WHEN 4 THEN t_str
             END,
             1.0
      FROM question_options qo
      JOIN questions q ON q.id = qo.question_id
      WHERE q.quiz_version_id = v_qv_id
        AND q.ord = 3;

      -- Q4: 1->ACT, 2->ANA, 3->SOC, 4->AUT
      INSERT INTO question_option_traits (question_option_id, trait_id, weight)
      SELECT qo.id,
             CASE qo.ord
               WHEN 1 THEN t_act
               WHEN 2 THEN t_ana
               WHEN 3 THEN t_soc
               WHEN 4 THEN t_aut
             END,
             1.0
      FROM question_options qo
      JOIN questions q ON q.id = qo.question_id
      WHERE q.quiz_version_id = v_qv_id
        AND q.ord = 4;

      v_created_total := v_created_total + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'LLM quizzes ensured/created: % (target %)', v_created_total, v_target_total;
END $$;

UPDATE profession_categories
SET
  name = CASE code
    WHEN 'sap' THEN 'SAP'
    WHEN 'it' THEN 'IT'
    WHEN 'engineering' THEN 'Инженерия'
    WHEN 'healthcare_medical' THEN 'Медицина'
    WHEN 'general' THEN 'Общее'
    ELSE name
  END,
  color_code = CASE code
    WHEN 'it' THEN '#3B82F6'
    WHEN 'healthcare_medical' THEN '#22C55E'
    WHEN 'general' THEN '#A855F7'
    WHEN 'engineering' THEN '#F97316'
    WHEN 'sap' THEN '#06B6D4'
    ELSE color_code
  END
WHERE code IN ('sap','it','engineering','healthcare_medical','general');


INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT 'profession_category', pc.id, 'ru', 'title',
  CASE pc.code
    WHEN 'sap' THEN 'SAP'
    WHEN 'it' THEN 'IT'
    WHEN 'engineering' THEN 'Инженерия'
    WHEN 'healthcare_medical' THEN 'Медицина'
    WHEN 'general' THEN 'Общее'
    ELSE pc.name
  END
FROM profession_categories pc
WHERE pc.code IN ('sap','it','engineering','healthcare_medical','general')
ON CONFLICT (entity_type, entity_id, locale, field)
DO UPDATE SET text = EXCLUDED.text;

INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT 'profession_category', pc.id, 'en', 'title',
  CASE pc.code
    WHEN 'sap' THEN 'SAP'
    WHEN 'it' THEN 'IT'
    WHEN 'engineering' THEN 'Engineering'
    WHEN 'healthcare_medical' THEN 'Healthcare'
    WHEN 'general' THEN 'General'
    ELSE pc.name
  END
FROM profession_categories pc
WHERE pc.code IN ('sap','it','engineering','healthcare_medical','general')
ON CONFLICT (entity_type, entity_id, locale, field)
DO UPDATE SET text = EXCLUDED.text;

UPDATE quizzes
SET description_default = CASE code
  WHEN 'riasec_main' THEN 'Quick visual test based on the RIASEC model. Learn your strengths and get career direction suggestions.'
  ELSE description_default
END
WHERE code IN ('riasec_main');

INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'en', 'description',
  CASE q.code
    WHEN 'riasec_main' THEN 'Quick visual test based on the RIASEC model. Learn your strengths and get career direction suggestions.'
    ELSE COALESCE(q.description_default, '')
  END
FROM quizzes q
WHERE q.code IN ('riasec_main')
ON CONFLICT (entity_type, entity_id, locale, field)
DO UPDATE SET text = EXCLUDED.text;

INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'ru', 'description',
  CASE q.code
    WHEN 'riasec_main' THEN 'Короткий визуальный тест по модели RIASEC. Узнай сильные стороны и получи подсказки по карьерному направлению.'
    ELSE ''
  END
FROM quizzes q
WHERE q.code IN ('riasec_main')
ON CONFLICT (entity_type, entity_id, locale, field)
DO UPDATE SET text = EXCLUDED.text;

INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT 'quiz', q.id, 'ru', 'title',
  CASE q.code
    WHEN 'riasec_main' THEN 'RIASEC: профориентационный тест'
    ELSE q.title_default
  END
FROM quizzes q
WHERE q.code IN ('riasec_main')
ON CONFLICT (entity_type, entity_id, locale, field)
DO UPDATE SET text = EXCLUDED.text;

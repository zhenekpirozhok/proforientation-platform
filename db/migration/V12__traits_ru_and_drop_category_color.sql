INSERT INTO translations(entity_type, entity_id, locale, field, text)
SELECT
  'trait' AS entity_type,
  tp.id   AS entity_id,
  'ru'    AS locale,
  'title' AS field,
  CASE tp.code
    WHEN 'R' THEN 'Реалистичный'
    WHEN 'I' THEN 'Исследовательский'
    WHEN 'A' THEN 'Артистический'
    WHEN 'S' THEN 'Социальный'
    WHEN 'E' THEN 'Предпринимательский'
    WHEN 'C' THEN 'Конвенциональный'
    ELSE tp.name
  END AS text
FROM trait_profiles tp
WHERE tp.code IN ('R','I','A','S','E','C')
ON CONFLICT (entity_type, entity_id, locale, field)
DO UPDATE SET text = EXCLUDED.text;

CREATE OR REPLACE VIEW trait_profiles_ru AS
SELECT
  tp.id,
  tp.code,
  COALESCE(t_title.text, tp.name)        AS name,
  COALESCE(t_desc.text, tp.description)  AS description,
  tp.bipolar_pair_code
FROM trait_profiles tp
LEFT JOIN translations t_title
  ON t_title.entity_type = 'trait'
 AND t_title.entity_id   = tp.id
 AND t_title.field       = 'title'
 AND t_title.locale      = 'ru'
LEFT JOIN translations t_desc
  ON t_desc.entity_type = 'trait'
 AND t_desc.entity_id   = tp.id
 AND t_desc.field       = 'description'
 AND t_desc.locale      = 'ru';

CREATE OR REPLACE VIEW trait_profiles_en AS
SELECT
  tp.id,
  tp.code,
  COALESCE(t_title.text, tp.name)        AS name,
  COALESCE(t_desc.text, tp.description)  AS description,
  tp.bipolar_pair_code
FROM trait_profiles tp
LEFT JOIN translations t_title
  ON t_title.entity_type = 'trait'
 AND t_title.entity_id   = tp.id
 AND t_title.field       = 'title'
 AND t_title.locale      = 'en'
LEFT JOIN translations t_desc
  ON t_desc.entity_type = 'trait'
 AND t_desc.entity_id   = tp.id
 AND t_desc.field       = 'description'
 AND t_desc.locale      = 'en';

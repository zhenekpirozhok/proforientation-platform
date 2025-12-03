INSERT INTO profession_categories (code, name)
VALUES
  ('sap',                 'SAP-специалисты'),
  ('it',                  'IT / Программирование / Разработка'),
  ('engineering',         'Инженерные профессии'),
  ('healthcare_medical',  'Медицина / Здравоохранение'),
  ('general',            'Общие направления / прочее');


DO $$
DECLARE
  v_name text;
  v_code text;
BEGIN

  FOREACH v_name IN ARRAY ARRAY[
    'Accounting', 'Actuarial Science', 'Administration / Office Management',
    'Advertising / Marketing', 'Agricultural Economics', 'Agriculture / Agribusiness',
    'Animal Science / Veterinary', 'Animation / Game Design', 'Anthropology',
    'Archaeology', 'Art / Fine Arts', 'Artificial Intelligence / Machine Learning',
    'Artificial Intelligence / Robotics Engineering', 'Aviation',
    'Automotive / Mechanical Technology', 'Banking / Finance',
    'Bioengineering / Biomedical Engineering', 'Biochemistry',
    'Biology / Life Sciences', 'Biomedical Science', 'Biophysics',
    'Biotechnology', 'Business Administration / Management',
    'Cartography / Spatial Analysis', 'Chemical Engineering', 'Chemistry',
    'Child Development / Early Childhood Education', 'Civil Engineering',
    'Cognitive Science / Neuroscience', 'Communication / Media Studies',
    'Community Development / Social Services', 'Computer Engineering',
    'Computer Science / Information Technology', 'Construction / Building Management',
    'Counseling / Therapy', 'Creative Writing', 'Criminal Justice / Law Enforcement',
    'Criminal Psychology', 'Cultural Studies / Heritage',
    'Cybersecurity / Information Security', 'Data Science / Statistics',
    'Dental / Oral Health', 'Design', 'Dietetics / Nutrition',
    'Digital Marketing / E-commerce', 'Drama / Theatre / Performing Arts',
    'Economics', 'Education / Teaching', 'Electrical Engineering',
    'Electronic Engineering', 'Emergency Management / Public Safety',
    'Energy / Petroleum Engineering', 'English / Literature / Linguistics',
    'Environmental Science / Sustainability', 'Epidemiology', 'Scriptwriting',
    'Fashion / Textile Design', 'Film / TV / Media Production',
    'Finance / Investment', 'Food Science / Food Technology',
    'Forensic Science / Criminalistics', 'Genetics',
    'Gender Studies / Feminist Studies', 'Geography / GIS',
    'Geology / Earth Science', 'Graphic Design', 'Health Administration / Health Management',
    'Healthcare / Medicine', 'History / Archaeology',
    'Hospitality Management / Tourism', 'Human Resources / Organizational Development',
    'Humanities / Liberal Arts', 'Industrial / Organizational Psychology',
    'Industrial Design', 'Industrial Engineering / Manufacturing',
    'Information Systems / Data Management', 'Interior Design',
    'International Relations / Political Science', 'Journalism',
    'Kinesiology / Exercise Science', 'Law / Legal Studies',
    'Library and Information Science', 'Linguistics',
    'Logistics / Supply Chain Management', 'Management Information Systems',
    'Marine / Oceanography', 'Materials Science / Nanotechnology',
    'Mathematics / Applied Mathematics', 'Mechanical Engineering',
    'Media and Communication', 'Medical Laboratory Science',
    'Military Science / Defense Studies', 'Ministry / Religious Studies / Theology',
    'Molecular Biology', 'Music / Music Technology',
    'Nanotechnology / Materials Science', 'Nursing', 'Occupational Therapy',
    'Operations Management', 'Optometry / Vision Science',
    'Paralegal / Legal Assistance', 'Pharmacy / Pharmacology',
    'Philosophy / Ethics', 'Physical Therapy / Rehabilitation',
    'Physics / Astronomy', 'Political Science / Governance',
    'Product Design', 'Psychology', 'Public Administration / Public Policy',
    'Public Health', 'Publishing', 'Real Estate / Property Management',
    'Robotics / Automation Engineering', 'Social Work / Human Services',
    'Sociology / Social Sciences', 'Software Engineering / Programming',
    'Speech Language Pathology', 'Sports Management',
    'Systems Engineering / Technology Management', 'Urban Planning',
    'Veterinary Medicine / Animal Care', 'Visual Communication'
  ]
  LOOP
    -- генерируем code в формате ^[a-z0-9_]+$ из человеко-читаемого названия
    v_code := regexp_replace(lower(v_name), '[^a-z0-9]+', '_', 'g');
    v_code := regexp_replace(v_code, '_+', '_', 'g');          -- схлопываем повторные _
    v_code := regexp_replace(v_code, '^_+|_+$', '', 'g');      -- обрезаем _ по краям

    INSERT INTO professions (code, title_default, description, category_id, ml_class_code)
    VALUES (
      v_code,                              -- внутренний код платформы
      v_name,                              -- человеко-читаемое название
      NULL,                                -- description можно заполнить позже через админку
      (SELECT id FROM profession_categories WHERE code = 'general'),
      v_name                               -- ml_class_code = оригинальная категория из ML
    )
    ON CONFLICT (code) DO NOTHING;         -- чтобы не падать, если сиды прогонялись повторно
  END LOOP;
END $$;

INSERT INTO professions (code, title_default, description, category_id, ml_class_code)
VALUES
  ('sap_consultant',
   'SAP Consultant',
   'Специалист по внедрению и настройке решений SAP.',
   (SELECT id FROM profession_categories WHERE code = 'sap'),
   NULL),

  ('sap_ux_designer',
   'SAP UX Designer',
   'Дизайнер пользовательских интерфейсов SAP Fiori / UI5.',
   (SELECT id FROM profession_categories WHERE code = 'sap'),
   NULL),

  ('sap_project_manager',
   'SAP Project Manager',
   'Менеджер проектов по внедрению SAP.',
   (SELECT id FROM profession_categories WHERE code = 'sap'),
   NULL),

  ('sap_developer',
   'SAP Developer',
   'Разработчик SAP (ABAP / SAPUI5 / BTP).',
   (SELECT id FROM profession_categories WHERE code = 'sap'),
   NULL);

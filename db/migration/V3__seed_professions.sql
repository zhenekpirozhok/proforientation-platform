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
  v_ru   text;
  v_code text;
BEGIN

  FOR v_name, v_ru IN
  SELECT * FROM unnest(
    ARRAY[
      'Accounting','Actuarial Science','Administration / Office Management',
      'Advertising / Marketing','Agricultural Economics','Agriculture / Agribusiness',
      'Animal Science / Veterinary','Animation / Game Design','Anthropology',
      'Archaeology','Art / Fine Arts','Artificial Intelligence / Machine Learning',
      'Artificial Intelligence / Robotics Engineering','Aviation',
      'Automotive / Mechanical Technology','Banking / Finance',
      'Bioengineering / Biomedical Engineering','Biochemistry',
      'Biology / Life Sciences','Biomedical Science','Biophysics',
      'Biotechnology','Business Administration / Management',
      'Cartography / Spatial Analysis','Chemical Engineering','Chemistry',
      'Child Development / Early Childhood Education','Civil Engineering',
      'Cognitive Science / Neuroscience','Communication / Media Studies',
      'Community Development / Social Services','Computer Engineering',
      'Computer Science / Information Technology','Construction / Building Management',
      'Counseling / Therapy','Creative Writing','Criminal Justice / Law Enforcement',
      'Criminal Psychology','Cultural Studies / Heritage',
      'Cybersecurity / Information Security','Data Science / Statistics',
      'Dental / Oral Health','Design','Dietetics / Nutrition',
      'Digital Marketing / E-commerce','Drama / Theatre / Performing Arts',
      'Economics','Education / Teaching','Electrical Engineering',
      'Electronic Engineering','Emergency Management / Public Safety',
      'Energy / Petroleum Engineering','English / Literature / Linguistics',
      'Environmental Science / Sustainability','Epidemiology','Scriptwriting',
      'Fashion / Textile Design','Film / TV / Media Production',
      'Finance / Investment','Food Science / Food Technology',
      'Forensic Science / Criminalistics','Genetics',
      'Gender Studies / Feminist Studies','Geography / GIS',
      'Geology / Earth Science','Graphic Design','Health Administration / Health Management',
      'Healthcare / Medicine','History / Archaeology',
      'Hospitality Management / Tourism','Human Resources / Organizational Development',
      'Humanities / Liberal Arts','Industrial / Organizational Psychology',
      'Industrial Design','Industrial Engineering / Manufacturing',
      'Information Systems / Data Management','Interior Design',
      'International Relations / Political Science','Journalism',
      'Kinesiology / Exercise Science','Law / Legal Studies',
      'Library and Information Science','Linguistics',
      'Logistics / Supply Chain Management','Management Information Systems',
      'Marine / Oceanography','Materials Science / Nanotechnology',
      'Mathematics / Applied Mathematics','Mechanical Engineering',
      'Media and Communication','Medical Laboratory Science',
      'Military Science / Defense Studies','Ministry / Religious Studies / Theology',
      'Molecular Biology','Music / Music Technology',
      'Nanotechnology / Materials Science','Nursing','Occupational Therapy',
      'Operations Management','Optometry / Vision Science',
      'Paralegal / Legal Assistance','Pharmacy / Pharmacology',
      'Philosophy / Ethics','Physical Therapy / Rehabilitation',
      'Physics / Astronomy','Political Science / Governance',
      'Product Design','Psychology','Public Administration / Public Policy',
      'Public Health','Publishing','Real Estate / Property Management',
      'Robotics / Automation Engineering','Social Work / Human Services',
      'Sociology / Social Sciences','Software Engineering / Programming',
      'Speech Language Pathology','Sports Management',
      'Systems Engineering / Technology Management','Urban Planning',
      'Veterinary Medicine / Animal Care','Visual Communication'
    ],
    ARRAY[
      'Бухгалтер','Актуарий','Офис-менеджер',
      'Маркетолог','Аграрный экономист','Агроном',
      'Ветеринар','Гейм-дизайнер','Антрополог',
      'Археолог','Художник','ML-инженер',
      'Инженер по робототехнике','Специалист по авиации',
      'Автомеханик','Финансист',
      'Биомедицинский инженер','Биохимик',
      'Биолог','Биомедицинский исследователь','Биофизик',
      'Биотехнолог','Бизнес-менеджер',
      'Картограф','Инженер-химик','Химик',
      'Педагог раннего развития','Инженер-строитель',
      'Нейроучёный','Специалист по коммуникациям',
      'Социальный координатор','Инженер-вычислительщик',
      'IT-специалист','Руководитель строительства',
      'Психолог-консультант','Писатель',
      'Сотрудник правоохранительных органов',
      'Криминальный психолог','Специалист по культурному наследию',
      'Специалист по кибербезопасности','Data Scientist',
      'Стоматолог','Дизайнер','Диетолог',
      'Интернет-маркетолог','Актёр',
      'Экономист','Преподаватель','Инженер-электрик',
      'Инженер-электроник','Специалист по ЧС',
      'Инженер-нефтяник','Филолог-англист',
      'Эколог','Эпидемиолог','Сценарист',
      'Дизайнер одежды','Видеооператор',
      'Инвестиционный аналитик','Технолог пищевого производства',
      'Судебный эксперт','Генетик',
      'Исследователь гендерных проблем','Географ',
      'Геолог','Графический дизайнер','Менеджер здравоохранения',
      'Врач','Историк',
      'Менеджер по туризму','HR-специалист',
      'Гуманитарий','Организационный психолог',
      'Промышленный дизайнер','Инженер по производству',
      'Системный аналитик','Дизайнер интерьеров',
      'Политолог-международник','Журналист',
      'Реабилитолог','Юрист',
      'Библиотекарь','Лингвист',
      'Логист','MIS-аналитик',
      'Океанолог','Инженер по материалам',
      'Математик','Инженер-механик',
      'Медиа-специалист','Лаборант-диагност',
      'Военный аналитик','Теолог',
      'Молекулярный биолог','Звукорежиссёр',
      'Нанотехнолог','Медсестра',
      'Эрготерапевт','Операционный менеджер',
      'Оптометрист','Помощник юриста',
      'Фармацевт','Философ',
      'Физиотерапевт','Физик',
      'Политолог','Продуктовый дизайнер',
      'Психолог','Госслужащий',
      'Специалист по общественному здоровью',
      'Издательский менеджер','Риелтор',
      'Инженер по автоматизации','Социальный работник',
      'Социолог','Программист',
      'Логопед','Спортивный менеджер',
      'Системный инженер','Градостроитель',
      'Ветеринарный врач','Специалист по визуальным коммуникациям'
    ]
  )
  LOOP
    -- генерируем code так же, как в основном сиде
    v_code := regexp_replace(lower(v_name), '[^a-z0-9]+', '_', 'g');
    v_code := regexp_replace(v_code, '_+', '_', 'g');
    v_code := regexp_replace(v_code, '^_+|_+$', '', 'g');

    -- вставляем русский перевод как НАЗВАНИЕ ПРОФЕССИИ
    INSERT INTO translations (entity_type, entity_id, locale, field, text)
    SELECT
      'profession',
      p.id,
      'ru',
      'title',
      v_ru
    FROM professions p
    WHERE p.code = v_code
    ON CONFLICT (entity_type, entity_id, locale, field) DO NOTHING;

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

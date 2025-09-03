-- Языки
INSERT INTO languages (code, name) VALUES
  ('en', 'English'),
  ('ru', 'Русский');

-- Статусы
INSERT INTO statuses (code) VALUES
  ('in_progress'),
  ('completed');

INSERT INTO statuses_t (code, lang, name_t) VALUES
  ('in_progress', 'en', 'In progress'),
  ('in_progress', 'ru', 'В процессе'),
  ('completed', 'en', 'Completed'),
  ('completed', 'ru', 'Завершен');

-- Пользователи
INSERT INTO users (uuid, name, password_hash, email, role) VALUES
  (gen_random_uuid(), 'Alice', 'hash1', 'alice@example.com', 'user'),
  (gen_random_uuid(), 'Zhenya', 'hash2', 'kavalchuk.yauheniya@student.ehu.lt', 'admin'),
  (gen_random_uuid(), 'Alena', 'hash3', 'tsibets.alena@student.ehu.lt', 'admin');

-- Тест
INSERT INTO tests DEFAULT VALUES RETURNING id;
-- допустим возвращает id = 1

INSERT INTO tests_t (test_id, lang, title_t, description_t, instruction_t) VALUES
  (1, 'en', 'Career Orientation Test', 'Test description EN', 'Instruction EN'),
  (1, 'ru', 'Профориентационный тест', 'Описание теста RU', 'Инструкция RU');

-- Шкала
INSERT INTO scales DEFAULT VALUES RETURNING id;
-- допустим возвращает id = 1

INSERT INTO scales_t (scale_id, lang, name_t) VALUES
  (1, 'en', 'Logic'),
  (1, 'ru', 'Логика');

INSERT INTO test_scales (test_id, scale_id) VALUES (1, 1);

-- Набор вариантов ответа
INSERT INTO answer_option_sets (question_type) VALUES ('single_choice') RETURNING id;
-- допустим возвращает id = 1

INSERT INTO answer_option_sets_t (set_id, lang, name_t) VALUES
  (1, 'en', 'Yes/No'),
  (1, 'ru', 'Да/Нет');

-- Варианты ответа
INSERT INTO answer_options DEFAULT VALUES RETURNING id; -- id = 1
INSERT INTO answer_options_t (option_id, lang, text_t) VALUES
  (1, 'en', 'Yes'),
  (1, 'ru', 'Да');

INSERT INTO answer_options DEFAULT VALUES RETURNING id; -- id = 2
INSERT INTO answer_options_t (option_id, lang, text_t) VALUES
  (2, 'en', 'No'),
  (2, 'ru', 'Нет');

INSERT INTO answer_option_set_items (set_id, answer_option_id, position) VALUES
  (1, 1, 1),
  (1, 2, 2);

-- Вопрос
INSERT INTO questions (test_id, type, answer_option_set_id)
VALUES (1, 'single_choice', 1) RETURNING id; -- id = 1

INSERT INTO questions_t (question_id, lang, text_t) VALUES
  (1, 'en', 'Do you like working with numbers?'),
  (1, 'ru', 'Вам нравится работать с числами?');

-- Влияние ответов на шкалу
INSERT INTO answer_impacts (answer_option_id, question_id, scale_id, weight) VALUES
  (1, 1, 1, 2),  -- Yes → +2 по шкале "Логика"
  (2, 1, 1, 0);  -- No  → 0

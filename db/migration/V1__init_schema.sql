-- ENUM TYPES
CREATE TYPE user_roles AS ENUM ('user', 'admin', 'anonymous');
CREATE TYPE question_type AS ENUM ('range_choice', 'single_choice', 'multiple_choice');
CREATE TYPE sex_type AS ENUM ('male', 'female', 'other');

-- LANGUAGES
CREATE TABLE languages (
  code varchar(10) PRIMARY KEY,
  name varchar(100)
);

-- STATUSES
CREATE TABLE statuses (
  code varchar(20) PRIMARY KEY
);

CREATE TABLE statuses_t (
  code varchar(20),
  lang varchar(10),
  name_t varchar(100),
  UNIQUE (code, lang),
  FOREIGN KEY (code) REFERENCES statuses(code),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- USERS
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid uuid UNIQUE NOT NULL,
  name varchar(255),
  password_hash varchar(255),
  email varchar(255),
  created_at timestamp DEFAULT now(),
  role user_roles
);

-- TESTS
CREATE TABLE tests (
  id SERIAL PRIMARY KEY,
  created_at timestamp DEFAULT now()
);

CREATE TABLE tests_t (
  test_id int,
  lang varchar(10),
  title_t varchar(255),
  description_t text,
  instruction_t text,
  UNIQUE (test_id, lang),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- SCALES
CREATE TABLE scales (
  id SERIAL PRIMARY KEY
);

CREATE TABLE scales_t (
  scale_id int,
  lang varchar(10),
  name_t varchar(255),
  UNIQUE (scale_id, lang),
  FOREIGN KEY (scale_id) REFERENCES scales(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

CREATE TABLE test_scales (
  test_id int,
  scale_id int,
  PRIMARY KEY (test_id, scale_id),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (scale_id) REFERENCES scales(id)
);

-- ANSWER OPTIONS
CREATE TABLE answer_option_sets (
  id SERIAL PRIMARY KEY,
  question_type question_type
);

CREATE TABLE answer_option_sets_t (
  set_id int,
  lang varchar(10),
  name_t varchar(255),
  UNIQUE (set_id, lang),
  FOREIGN KEY (set_id) REFERENCES answer_option_sets(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

CREATE TABLE answer_options (
  id SERIAL PRIMARY KEY
);

CREATE TABLE answer_options_t (
  option_id int,
  lang varchar(10),
  text_t varchar(255),
  UNIQUE (option_id, lang),
  FOREIGN KEY (option_id) REFERENCES answer_options(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

CREATE TABLE answer_option_set_items (
  set_id int,
  answer_option_id int,
  position int,
  PRIMARY KEY (set_id, answer_option_id),
  FOREIGN KEY (set_id) REFERENCES answer_option_sets(id),
  FOREIGN KEY (answer_option_id) REFERENCES answer_options(id)
);

-- QUESTIONS
CREATE TABLE questions (
  id SERIAL PRIMARY KEY,
  test_id int,
  type question_type,
  answer_option_set_id int,
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (answer_option_set_id) REFERENCES answer_option_sets(id)
);

CREATE TABLE questions_t (
  question_id int,
  lang varchar(10),
  text_t varchar(255),
  UNIQUE (question_id, lang),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- ANSWER IMPACTS
CREATE TABLE answer_impacts (
  id SERIAL PRIMARY KEY,
  answer_option_id int,
  question_id int,
  scale_id int,
  weight int,
  FOREIGN KEY (answer_option_id) REFERENCES answer_options(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (scale_id) REFERENCES scales(id)
);

-- TEST SESSIONS
CREATE TABLE test_sessions (
  id SERIAL PRIMARY KEY,
  user_id int,
  test_id int,
  started_at timestamp,
  completed_at timestamp,
  status varchar(20),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (status) REFERENCES statuses(code)
);

CREATE TABLE test_answers (
  id SERIAL PRIMARY KEY,
  test_session_id int,
  question_id int,
  answer_option_id int,
  created_at timestamp DEFAULT now(),
  FOREIGN KEY (test_session_id) REFERENCES test_sessions(id),
  FOREIGN KEY (question_id) REFERENCES questions(id),
  FOREIGN KEY (answer_option_id) REFERENCES answer_options(id)
);

-- RESULT LEVELS
CREATE TABLE result_levels (
  test_id int,
  scale_id int,
  level_id SERIAL PRIMARY KEY,
  min_points int,
  max_points int,
  UNIQUE (test_id, scale_id, level_id),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (scale_id) REFERENCES scales(id)
);

CREATE TABLE result_levels_t (
  test_id int,
  scale_id int,
  level_id int,
  lang varchar(10),
  name_t varchar(255),
  explanation_t text,
  PRIMARY KEY (test_id, scale_id, level_id, lang),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (scale_id) REFERENCES scales(id),
  FOREIGN KEY (level_id) REFERENCES result_levels(level_id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- PROFESSIONS
CREATE TABLE profession_sets (
  id SERIAL PRIMARY KEY
);

CREATE TABLE profession_sets_t (
  profession_set_id int,
  lang varchar(10),
  name_t varchar(255),
  description_t text,
  UNIQUE (profession_set_id, lang),
  FOREIGN KEY (profession_set_id) REFERENCES profession_sets(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

CREATE TABLE professions (
  id SERIAL PRIMARY KEY,
  profession_set_id int,
  FOREIGN KEY (profession_set_id) REFERENCES profession_sets(id)
);

CREATE TABLE professions_t (
  profession_id int,
  lang varchar(10),
  name_t varchar(255),
  description_t text,
  UNIQUE (profession_id, lang),
  FOREIGN KEY (profession_id) REFERENCES professions(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- LEVEL SCALE CRITERIA
CREATE TABLE level_scale_criteria (
  id SERIAL PRIMARY KEY,
  level_id int,
  scale_id int,
  min_score int,
  max_score int,
  FOREIGN KEY (level_id) REFERENCES result_levels(level_id),
  FOREIGN KEY (scale_id) REFERENCES scales(id)
);

CREATE TABLE level_scale_criteria_t (
  criteria_id int,
  lang varchar(10),
  description_t text,
  UNIQUE (criteria_id, lang),
  FOREIGN KEY (criteria_id) REFERENCES level_scale_criteria(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- PROFESSION RECOMMENDATIONS
CREATE TABLE profession_recommendations (
  test_id int,
  scale_id int,
  level_id int,
  profession_id int,
  recommendation_key varchar(255),
  explanation_key varchar(255),
  PRIMARY KEY (test_id, scale_id, level_id, profession_id),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (scale_id) REFERENCES scales(id),
  FOREIGN KEY (level_id) REFERENCES result_levels(level_id),
  FOREIGN KEY (profession_id) REFERENCES professions(id)
);

CREATE TABLE profession_recommendations_t (
  test_id int,
  scale_id int,
  level_id int,
  profession_id int,
  lang varchar(10),
  recommendation_t varchar(500),
  explanation_t text,
  UNIQUE (test_id, scale_id, level_id, profession_id, lang),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (scale_id) REFERENCES scales(id),
  FOREIGN KEY (level_id) REFERENCES result_levels(level_id),
  FOREIGN KEY (profession_id) REFERENCES professions(id),
  FOREIGN KEY (lang) REFERENCES languages(code)
);

-- TEST PROFESSION SETS
CREATE TABLE test_profession_sets (
  id SERIAL PRIMARY KEY,
  test_id int,
  profession_set_id int,
  UNIQUE (test_id, profession_set_id),
  FOREIGN KEY (test_id) REFERENCES tests(id),
  FOREIGN KEY (profession_set_id) REFERENCES profession_sets(id)
);

-- USER PROFILES
CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  test_session_id int,
  education text,
  plans text,
  ref_code varchar(100),
  sex sex_type,
  year_of_birth int,
  created_at timestamp DEFAULT now(),
  FOREIGN KEY (test_session_id) REFERENCES test_sessions(id)
);

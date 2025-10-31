-- Seed RIASEC traits
INSERT INTO trait_profiles (code, name, description) VALUES
  ('R','Realistic','Практичные, механические, технические виды деятельности'),
  ('I','Investigative','Аналитика, исследование, наука'),
  ('A','Artistic','Творчество, дизайн, выражение'),
  ('S','Social','Работа с людьми, обучение, поддержка'),
  ('E','Enterprising','Лидерство, предпринимательство, влияние'),
  ('C','Conventional','Организация, учет, внимательность к деталям')
ON CONFLICT (code) DO NOTHING;

-- Demo admin user (replace hash in real env!)
INSERT INTO users (email, password_hash, display_name, is_admin)
VALUES ('admin@example.com', '$2a$10$abcdefghijklmnopqrstuv', 'Админ', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Тестовые пользователи со всеми ролями
-- Пароль у всех: "password" (bcrypt)

INSERT INTO users (email, password_hash, display_name, role, is_active)
VALUES
  -- SUPERADMINS
  ('ya.kavalchuk@gmail.com',
   '$2b$12$sFjAaL5L6nvh8GtMLx3JZuX.1fKApn955WJE5tVqG8Y0nQntBjWni',
   'Zhenya', 'superadmin', TRUE),

  ('20220604@student.ehu.lt',
   '$2b$12$cTfNX.kl4VXnKdo6KZJ12e3L7YMF/7lasOq6aDfjDimNnemqme1hu',
   'Alena', 'superadmin', TRUE),

  -- ADMINS
  ('admin1@example.com',
   '$2b$12$lcqLS0Sv/Q4RzTGMTcoDt.C.91oIytT9M5m3bAop/DHxCzfDbNl2u',
   'Admin One', 'admin', TRUE),

  ('admin2@example.com',
   '$2b$12$aUjKP1dNl/zmWL6kHfulIuGsQZAr.hJZhHcsLPATzIFBO5Ldwo7MO',
   'Admin Two', 'admin', TRUE),

  -- USERS
  ('user1@example.com',
   '$2b$12$eZqFSMfJ8WJKL5JLEH6rFOWszRsXxDDFwZkEPIjgQq0QGPm0v9Rhu',
   'Test User One', 'user', TRUE),

  ('user2@example.com',
   '$2b$12$4oTpJiuATwJCCHsKQZnxqO3LClOIfE4ZxrOxTqmp3XL7dmU93N.aO',
   'Test User Two', 'user', TRUE);

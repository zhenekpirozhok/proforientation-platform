-- Тестовые пользователи со всеми ролями
-- Пароль у всех: "password" (bcrypt)

INSERT INTO users (email, password_hash, display_name, role, is_active)
VALUES
  -- SUPERADMINS
  ('ya.kavalchuk@gmail.com',
   '$2b$12$sFjAaL5L6nvh8GtMLx3JZuX.1fKApn955WJE5tVqG8Y0nQntBjWni',
   'Zhenya', 'SUPERADMIN', TRUE),

  ('20220604@student.ehu.lt',
   '$2b$12$cTfNX.kl4VXnKdo6KZJ12e3L7YMF/7lasOq6aDfjDimNnemqme1hu',
   'Alena', 'SUPERADMIN', TRUE),

  -- ADMINS
  ('admin1@example.com',
   '$2a$10$e8UVnqzL4PxyZTA1cCFnIuGT5HlVGxw4soWLob3z6xnxNrC6Th22m',
   'Admin One', 'ADMIN', TRUE),

  ('admin2@example.com',
   '$2b$12$aUjKP1dNl/zmWL6kHfulIuGsQZAr.hJZhHcsLPATzIFBO5Ldwo7MO',
   'Admin Two', 'ADMIN', TRUE),

  -- USERS
  ('user1@example.com',
   '$2b$12$eZqFSMfJ8WJKL5JLEH6rFOWszRsXxDDFwZkEPIjgQq0QGPm0v9Rhu',
   'Test User One', 'USER', TRUE),

  ('user2@example.com',
   '$2b$12$4oTpJiuATwJCCHsKQZnxqO3LClOIfE4ZxrOxTqmp3XL7dmU93N.aO',
   'Test User Two', 'USER', TRUE);

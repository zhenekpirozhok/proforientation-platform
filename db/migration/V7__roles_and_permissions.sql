----------------------------------------------------------------------
-- V7__roles_and_permissions.sql
-- Роли и права доступа к БД приложения
----------------------------------------------------------------------

-- 1. Групповые роли (без паролей)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_read') THEN
    CREATE ROLE app_read;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_write') THEN
    CREATE ROLE app_write;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_admin') THEN
    CREATE ROLE app_admin;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_analytics') THEN
    CREATE ROLE app_analytics;
  END IF;
END$$;


----------------------------------------------------------------------
-- 2. Логин-пользователь приложения (роль app_write)
----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${app_user_name}') THEN
    -- логин для приложения (НЕ суперюзер)
    EXECUTE format(
      'CREATE USER %I WITH PASSWORD %L',
      '${app_user_name}',
      '${app_user_password}'
    );
  END IF;

  -- выдаём права через роль app_write
  EXECUTE format('GRANT app_write TO %I', '${app_user_name}');
END$$;


----------------------------------------------------------------------
-- 3. Логин-пользователь для администрирования БД (роль app_admin)
--    Это НЕ суперюзер, но имеет полный доступ к объектам схемы.
----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${db_admin_name}') THEN
    EXECUTE format(
      'CREATE USER %I WITH PASSWORD %L',
      '${db_admin_name}',
      '${db_admin_password}'
    );
  END IF;

  EXECUTE format('GRANT app_admin TO %I', '${db_admin_name}');
END$$;


----------------------------------------------------------------------
-- 4. Общие права на схему public
----------------------------------------------------------------------

GRANT USAGE ON SCHEMA public TO app_read, app_write, app_admin, app_analytics;

-- (опционально) если хочешь жёстко задать CONNECT для базы, делай это
-- под конкретным именем БД, например:
-- GRANT CONNECT ON DATABASE mydb TO app_read, app_write, app_admin, app_analytics;


----------------------------------------------------------------------
-- 5. Права на ТАБЛИЦЫ
----------------------------------------------------------------------

-- READ-ONLY: app_read может только SELECT
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_read;

-- READ-WRITE: app_write может полный CRUD
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_write;

-- ADMIN: app_admin имеет полный доступ к таблицам (DDL/DML на уровне схемы)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_admin;


----------------------------------------------------------------------
-- 6. Права на ПОСЛЕДОВАТЕЛЬНОСТИ
----------------------------------------------------------------------

GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO app_read;
GRANT SELECT, USAGE, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_write;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_admin;


----------------------------------------------------------------------
-- 7. Ограничиваем app_analytics и даём доступ только к вьюхам для аналитики
----------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM app_analytics;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM app_analytics;

DO $$
BEGIN
  -- Маскированные пользователи
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_users_masked'
  ) THEN
    GRANT SELECT ON public.v_users_masked TO app_analytics;
  END IF;

  -- Маскированный обзор попыток
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_attempts_overview_masked'
  ) THEN
    GRANT SELECT ON public.v_attempts_overview_masked TO app_analytics;
  END IF;

  -- Статистика по квизам
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_quiz_attempts_stats'
  ) THEN
    GRANT SELECT ON public.v_quiz_attempts_stats TO app_analytics;
  END IF;

  -- Баллы по трейтам
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_attempt_trait_scores'
  ) THEN
    GRANT SELECT ON public.v_attempt_trait_scores TO app_analytics;
  END IF;

  -- Рекомендации по профессиям
  IF EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'public' AND table_name = 'v_attempt_recommendations'
  ) THEN
    GRANT SELECT ON public.v_attempt_recommendations TO app_analytics;
  END IF;
END$$;


----------------------------------------------------------------------
-- 8. DEFAULT PRIVILEGES для будущих объектов
--    (выполняется от владельца схемы, обычно это POSTGRES_USER)
----------------------------------------------------------------------

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON TABLES TO app_read;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_write;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO app_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT ON SEQUENCES TO app_read;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, USAGE, UPDATE ON SEQUENCES TO app_write;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO app_admin;

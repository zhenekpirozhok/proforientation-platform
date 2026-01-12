-- 1. Update existing users
UPDATE users
SET role = 'ADMIN',
    updated_at = now()
WHERE role = 'SUPERADMIN';
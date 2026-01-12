-- 1. Allow category_id to be NULL for draft quizzes
ALTER TABLE quizzes
    ALTER COLUMN category_id DROP NOT NULL;

-- 2. Set default processing mode to LLM
ALTER TABLE quizzes
    ALTER COLUMN processing_mode SET DEFAULT 'LLM';

-- 3. Enforce category presence for published quizzes
ALTER TABLE quizzes
    ADD CONSTRAINT chk_quizzes_category_required_when_published
        CHECK (
            status <> 'PUBLISHED'
                OR category_id IS NOT NULL
            );
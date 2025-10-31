COMMENT ON TABLE attempts IS 'Одна отправленная попытка (гость, если user_id IS NULL). Держим quiz_id и quiz_version_id для скорости и согласованности.';
COMMENT ON CONSTRAINT fk_attempts_version_matches_quiz ON attempts IS 'Гарантирует, что quiz_version принадлежит указанному quiz.';

-- Optional analytics index
CREATE INDEX IF NOT EXISTS attempts_quiz_date_idx
  ON attempts (quiz_id, submitted_at) WHERE submitted_at IS NOT NULL;

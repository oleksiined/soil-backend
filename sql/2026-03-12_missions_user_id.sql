-- =============================================
-- Міграція: додаємо user_id до таблиці missions
-- Потрібно для статистики зразків по юзеру
-- =============================================

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL;

-- FK без IF NOT EXISTS (не підтримується в PostgreSQL 15)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_missions_user'
  ) THEN
    ALTER TABLE missions
      ADD CONSTRAINT fk_missions_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_missions_user_id ON missions (user_id);

COMMENT ON COLUMN missions.user_id IS 'Юзер який виконує місію — для статистики зразків';

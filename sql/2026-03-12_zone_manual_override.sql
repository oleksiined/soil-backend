-- =============================================
-- Міграція: ручне підтвердження/скасування зони
-- Додаємо нові колонки до zone_sampling_status
-- =============================================

ALTER TABLE zone_sampling_status
  ADD COLUMN IF NOT EXISTS manual_override      BOOLEAN     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_by_user_id  INT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_at          TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS override_note        TEXT        DEFAULT NULL;

-- Індекс для швидкого пошуку вручну підтверджених зон
CREATE INDEX IF NOT EXISTS idx_zss_manual_override
  ON zone_sampling_status (manual_override)
  WHERE manual_override IS NOT NULL;

COMMENT ON COLUMN zone_sampling_status.manual_override IS
  'NULL=автологіка, TRUE=вручну підтверджено, FALSE=вручну скасовано';
COMMENT ON COLUMN zone_sampling_status.override_by_user_id IS
  'ID юзера який зробив ручну зміну';
COMMENT ON COLUMN zone_sampling_status.override_note IS
  'Коментар до ручної зміни';

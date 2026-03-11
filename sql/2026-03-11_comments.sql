-- =============================================
-- Міграція: таблиця comments
-- Коментарі на карті з прив'язкою до точки
-- =============================================

CREATE TABLE IF NOT EXISTS comments (
  id            SERIAL PRIMARY KEY,
  project_id    INT NOT NULL,
  user_id       INT NOT NULL,

  -- Координати точки на карті
  lat           DOUBLE PRECISION NOT NULL,
  lng           DOUBLE PRECISION NOT NULL,
  geom          geometry(Point, 4326),

  -- Поля коментаря
  "fieldName"   TEXT,
  problem       TEXT NOT NULL,
  "kmlPointId"  TEXT,
  photos        JSONB NOT NULL DEFAULT '[]',

  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_comments_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

  CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_comments_project_id ON comments (project_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_geom ON comments USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments ("createdAt" DESC);

-- Тригер для автооновлення updatedAt
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_comments_updated_at ON comments;
CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();

COMMENT ON TABLE comments IS 'Коментарі водіїв на карті: проблема, фото, прив''язка до зони і точки забурювання';

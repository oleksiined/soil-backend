-- =============================================
-- Міграція: таблиця kml_files
-- Зберігає завантажені KML файли всіх 4 типів
-- з розпарсеними placemarks у JSONB
-- =============================================

CREATE TABLE IF NOT EXISTS kml_files (
  id              SERIAL PRIMARY KEY,
  project_id      INT NOT NULL,
  "originalName"  TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('contour', 'track', 'point', 'centroid')),
  "rawContent"    TEXT NOT NULL,
  placemarks      JSONB NOT NULL DEFAULT '[]',
  "featureCount"  INT NOT NULL DEFAULT 0,
  "isArchived"    BOOLEAN NOT NULL DEFAULT false,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_kml_files_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Індекси
CREATE INDEX IF NOT EXISTS idx_kml_files_project_id ON kml_files (project_id);
CREATE INDEX IF NOT EXISTS idx_kml_files_type ON kml_files (type);
CREATE INDEX IF NOT EXISTS idx_kml_files_archived ON kml_files ("isArchived");

-- GIN індекс для пошуку по JSONB placemarks
CREATE INDEX IF NOT EXISTS idx_kml_files_placemarks ON kml_files USING GIN (placemarks);

-- Тригер для автооновлення updatedAt
CREATE OR REPLACE FUNCTION update_kml_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kml_files_updated_at ON kml_files;
CREATE TRIGGER trg_kml_files_updated_at
  BEFORE UPDATE ON kml_files
  FOR EACH ROW
  EXECUTE FUNCTION update_kml_files_updated_at();

-- =============================================
-- Коментарі
-- =============================================
COMMENT ON TABLE kml_files IS 'Завантажені KML файли: contour/track/point/centroid';
COMMENT ON COLUMN kml_files.type IS 'contour=контури зон, track=треки відбору, point=точки забурювання, centroid=назви зон';
COMMENT ON COLUMN kml_files.placemarks IS 'Розпарсені об''єкти з KML у форматі [{id, name, polygon?, lines?, point?, attributes?}]';

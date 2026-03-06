ALTER TABLE public.kml_layers
ADD COLUMN IF NOT EXISTS geom geometry(Polygon,4326);

CREATE INDEX IF NOT EXISTS idx_kml_layers_geom
ON public.kml_layers
USING GIST (geom);

CREATE TABLE IF NOT EXISTS zone_sampling_status (
  id SERIAL PRIMARY KEY,
  mission_id INT NOT NULL,
  zone_id INT NOT NULL,
  stops_count INT NOT NULL DEFAULT 0,
  is_sampled BOOLEAN NOT NULL DEFAULT false,
  sampled_at TIMESTAMPTZ,
  last_point_id INT NOT NULL DEFAULT 0,
  in_stop BOOLEAN NOT NULL DEFAULT false,
  stop_start_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_zss_mission FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  CONSTRAINT fk_zss_zone FOREIGN KEY (zone_id) REFERENCES kml_layers(id) ON DELETE CASCADE,
  CONSTRAINT uq_zss UNIQUE (mission_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_zss_mission_id ON zone_sampling_status (mission_id);
CREATE INDEX IF NOT EXISTS idx_zss_zone_id ON zone_sampling_status (zone_id);
CREATE INDEX IF NOT EXISTS idx_zss_sampled_at ON zone_sampling_status (sampled_at);

CREATE TABLE IF NOT EXISTS mission_processing_queue (
  mission_id INT PRIMARY KEY,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION enqueue_mission_processing()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO mission_processing_queue (mission_id, updated_at)
  VALUES (NEW.mission_id, NOW())
  ON CONFLICT (mission_id)
  DO UPDATE SET updated_at = EXCLUDED.updated_at;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_enqueue_mission_processing ON track_points;

CREATE TRIGGER trg_enqueue_mission_processing
AFTER INSERT ON track_points
FOR EACH ROW
EXECUTE FUNCTION enqueue_mission_processing();

CREATE INDEX IF NOT EXISTS idx_track_points_mission_createdat
ON track_points (mission_id, "createdAt");

CREATE INDEX IF NOT EXISTS idx_track_points_geom
ON track_points
USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_kml_layers_project_id
ON kml_layers (project_id);

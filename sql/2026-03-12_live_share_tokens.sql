-- =============================================
-- Міграція: таблиця live_share_tokens
-- Публічні посилання на live-перегляд (7 днів)
-- =============================================

CREATE TABLE IF NOT EXISTS live_share_tokens (
  id           SERIAL PRIMARY KEY,
  token        TEXT NOT NULL UNIQUE,
  project_id   INT NOT NULL,
  created_by   INT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_lst_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

  CONSTRAINT fk_lst_creator
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_live_share_token      ON live_share_tokens (token);
CREATE INDEX IF NOT EXISTS idx_live_share_project_id ON live_share_tokens (project_id);
CREATE INDEX IF NOT EXISTS idx_live_share_expires_at ON live_share_tokens (expires_at);

COMMENT ON TABLE live_share_tokens IS 'Публічні посилання для перегляду live-трекінгу (7 днів)';

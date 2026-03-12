-- =============================================
-- Міграція: таблиця user_project_access
-- Admin надає User доступ до конкретних проєктів
-- =============================================

CREATE TABLE IF NOT EXISTS user_project_access (
  id            SERIAL PRIMARY KEY,
  user_id       INT NOT NULL,
  project_id    INT NOT NULL,
  granted_by    INT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_upa_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

  CONSTRAINT fk_upa_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,

  CONSTRAINT uq_user_project
    UNIQUE (user_id, project_id)
);

CREATE INDEX IF NOT EXISTS idx_upa_user_id    ON user_project_access (user_id);
CREATE INDEX IF NOT EXISTS idx_upa_project_id ON user_project_access (project_id);

COMMENT ON TABLE user_project_access IS 'Доступ юзерів до проєктів — Admin призначає вручну';
COMMENT ON COLUMN user_project_access.granted_by IS 'ID адміна який надав доступ';

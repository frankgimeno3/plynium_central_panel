-- 036_user_lists_and_users_id.sql
-- 1) Añade users.id UUID como PK (id "más código"); id_user queda UNIQUE (email).
-- 2) Tabla user_lists (sustituye userLists.json).
-- 3) Tabla user_list_members (relación users <-> user_lists).
-- Idempotente.

-- Habilitar extensión para gen_random_uuid() si no existe
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Columna id UUID en users y reemplazo de PK
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') THEN
      ALTER TABLE users ADD COLUMN id UUID NOT NULL DEFAULT gen_random_uuid();
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
      ALTER TABLE users ADD PRIMARY KEY (id);
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_id_user_key' AND conrelid = 'public.users'::regclass
      ) THEN
        ALTER TABLE users ADD CONSTRAINT users_id_user_key UNIQUE (id_user);
      END IF;
    END IF;
  END IF;
END $$;

-- 2) Tabla user_lists (listas de newsletter; sustituye userLists.json)
CREATE TABLE IF NOT EXISTS user_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_code VARCHAR(64) NOT NULL,
  name VARCHAR(255),
  portal VARCHAR(64) DEFAULT 'plynium',
  topic VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_lists_list_code_key ON user_lists (list_code);
COMMENT ON TABLE user_lists IS 'Listas de envío de newsletters (antes userLists.json). list_code = identificador estable (ej. list_editors).';

-- 3) Tabla puente user_list_members (users <-> user_lists)
CREATE TABLE IF NOT EXISTS user_list_members (
  user_id UUID NOT NULL,
  list_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, list_id),
  CONSTRAINT fk_user_list_members_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_list_members_list FOREIGN KEY (list_id) REFERENCES user_lists (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_list_members_list_id_idx ON user_list_members (list_id);
COMMENT ON TABLE user_list_members IS 'Usuarios asignados a cada lista de newsletter.';

-- Seed de user_lists (equivalente al contenido de userLists.json)
INSERT INTO user_lists (list_code, name, portal, topic)
VALUES
  ('list_editors', 'Newsletter - Editores', 'plynium', 'articles'),
  ('list_admins', 'Newsletter - Administradores', 'plynium', 'admin'),
  ('list_publications', 'Newsletter - Publicaciones', 'plynium', 'publications')
ON CONFLICT (list_code) DO NOTHING;

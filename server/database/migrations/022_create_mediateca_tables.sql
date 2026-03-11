-- 022_create_mediateca_tables.sql
-- Tablas folders y media_contents. Idempotente.
-- Requiere pgcrypto (002). No se repite CREATE EXTENSION aquí.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type') THEN
        CREATE TYPE media_type AS ENUM ('pdf', 'image');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID REFERENCES folders(id) ON DELETE CASCADE,
    content_name VARCHAR(255) NOT NULL,
    s3_key TEXT NOT NULL UNIQUE,
    content_src TEXT,
    mime_type VARCHAR(100),
    type media_type NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_contents_folder_id ON media_contents(folder_id);
CREATE INDEX IF NOT EXISTS idx_media_contents_type ON media_contents(type);
CREATE INDEX IF NOT EXISTS idx_media_contents_created_at ON media_contents(created_at);

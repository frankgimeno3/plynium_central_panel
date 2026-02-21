-- 005_update_comments_to_publication.sql
-- Objetivo: Comentarios asociados a article_publication en lugar de solo article.
-- ADD COLUMN article_publication_id, backfill desde id_article + portal por defecto.
-- NO se borra comments.id_article en esta pasada (limpieza posterior).

-- Asumimos tabla comments existe con al menos: id_article y una columna de fecha (created_at o similar).
-- Ajusta el nombre de la columna de fecha en el índice al final si tu tabla usa otro nombre.

ALTER TABLE comments ADD COLUMN IF NOT EXISTS article_publication_id UUID NULL;

-- Backfill solo si comments.id_article existe (puede estar ya eliminada). Usamos EXECUTE para no referenciar id_article en SQL estático.
DO $$
DECLARE
    has_id_article BOOLEAN;
    default_pid INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'comments' AND column_name = 'id_article'
    ) INTO has_id_article;

    IF has_id_article THEN
        default_pid := COALESCE(
            (SELECT get_default_portal_id()),
            (SELECT id FROM portals ORDER BY created_at ASC NULLS LAST, id ASC LIMIT 1)
        );

        -- Para cada comment con id_article, obtener article_publications.id del portal por defecto
        EXECUTE 'UPDATE comments c SET article_publication_id = ap.id FROM article_publications ap WHERE ap.article_id = c.id_article AND ap.portal_id = $1 AND c.article_publication_id IS NULL'
            USING default_pid;

        -- Fallback: primera publication del artículo si existe
        EXECUTE 'UPDATE comments c SET article_publication_id = (SELECT ap.id FROM article_publications ap WHERE ap.article_id = c.id_article LIMIT 1) WHERE c.article_publication_id IS NULL AND c.id_article IS NOT NULL';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM comments WHERE article_publication_id IS NULL) THEN
        ALTER TABLE comments ALTER COLUMN article_publication_id SET NOT NULL;
    END IF;
END $$;

-- FK a article_publications(id)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_schema = 'public' AND table_name = 'comments'
          AND constraint_name = 'comments_article_publication_id_fkey'
    ) THEN
        ALTER TABLE comments
            ADD CONSTRAINT comments_article_publication_id_fkey
            FOREIGN KEY (article_publication_id) REFERENCES article_publications(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Asegurar columna de fecha para el índice (la tabla comments puede venir sin created_at).
ALTER TABLE comments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- Índice para listar comentarios por publicación ordenados por fecha.
CREATE INDEX IF NOT EXISTS comments_article_publication_id_created_at_idx
    ON comments (article_publication_id, created_at DESC);

-- NO se elimina comments.id_article (limpieza en 013)

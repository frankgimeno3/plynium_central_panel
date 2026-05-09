-- 028_publications_db_mediateca_folder_link.sql

BEGIN;

ALTER TABLE public.publications_db
  ADD COLUMN IF NOT EXISTS mediateca_folder_id UUID NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'publications_db_mediateca_folder_id_fkey'
  ) THEN
    ALTER TABLE public.publications_db
      ADD CONSTRAINT publications_db_mediateca_folder_id_fkey
      FOREIGN KEY (mediateca_folder_id)
      REFERENCES public.mediateca_folders (mediateca_folder_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS publications_db_mediateca_folder_id_idx
  ON public.publications_db (mediateca_folder_id)
  WHERE mediateca_folder_id IS NOT NULL;

DO $$
DECLARE
  structural_id   UUID;
  production_id   UUID;
  publications_id UUID;
  magazines_id    UUID;
  pub             RECORD;
  desired_name    TEXT;
  folder_id       UUID;
BEGIN
  SELECT mediateca_folder_id INTO structural_id
    FROM public.mediateca_folders
    WHERE mediateca_parent_folder_id IS NULL
      AND regexp_replace(lower(mediateca_folder_name), '\s+', ' ', 'g') = 'structural media'
    LIMIT 1;

  IF structural_id IS NULL THEN
    RAISE NOTICE 'Skipping magazines media backfill: "Structural media" folder not found';
    RETURN;
  END IF;

  SELECT mediateca_folder_id INTO production_id
    FROM public.mediateca_folders
    WHERE mediateca_parent_folder_id = structural_id
      AND regexp_replace(lower(mediateca_folder_name), '\s+', ' ', 'g') = 'production media'
    LIMIT 1;

  IF production_id IS NULL THEN
    RAISE NOTICE 'Skipping magazines media backfill: "Production media" folder not found';
    RETURN;
  END IF;

  SELECT mediateca_folder_id INTO publications_id
    FROM public.mediateca_folders
    WHERE mediateca_parent_folder_id = production_id
      AND regexp_replace(lower(mediateca_folder_name), '\s+', ' ', 'g') = 'publications media'
    LIMIT 1;

  IF publications_id IS NULL THEN
    RAISE NOTICE 'Skipping magazines media backfill: "publications media" folder not found';
    RETURN;
  END IF;

  SELECT mediateca_folder_id INTO magazines_id
    FROM public.mediateca_folders
    WHERE mediateca_parent_folder_id = publications_id
      AND regexp_replace(lower(mediateca_folder_name), '\s+', ' ', 'g') = 'magazines media'
    LIMIT 1;

  IF magazines_id IS NULL THEN
    INSERT INTO public.mediateca_folders (
      mediateca_folder_id,
      mediateca_folder_name,
      mediateca_parent_folder_id,
      mediateca_folder_created_at,
      mediateca_folder_updated_at
    ) VALUES (
      gen_random_uuid(),
      'magazines media',
      publications_id,
      now(),
      now()
    )
    RETURNING mediateca_folder_id INTO magazines_id;
  END IF;

  FOR pub IN
    SELECT publication_id, publication_edition_name, mediateca_folder_id
      FROM public.publications_db
      ORDER BY publication_id
  LOOP
    desired_name := COALESCE(
      NULLIF(btrim(pub.publication_edition_name), ''),
      pub.publication_id::TEXT
    );

    IF pub.mediateca_folder_id IS NOT NULL THEN
      UPDATE public.mediateca_folders
        SET mediateca_folder_name = desired_name,
            mediateca_folder_updated_at = now()
        WHERE mediateca_folder_id = pub.mediateca_folder_id
          AND mediateca_folder_name IS DISTINCT FROM desired_name;

      CONTINUE;
    END IF;

    SELECT mediateca_folder_id INTO folder_id
      FROM public.mediateca_folders
      WHERE mediateca_parent_folder_id = magazines_id
        AND regexp_replace(lower(mediateca_folder_name), '\s+', ' ', 'g')
            = regexp_replace(lower(desired_name), '\s+', ' ', 'g')
      LIMIT 1;

    IF folder_id IS NULL THEN
      INSERT INTO public.mediateca_folders (
        mediateca_folder_id,
        mediateca_folder_name,
        mediateca_parent_folder_id,
        mediateca_folder_created_at,
        mediateca_folder_updated_at
      ) VALUES (
        gen_random_uuid(),
        desired_name,
        magazines_id,
        now(),
        now()
      )
      RETURNING mediateca_folder_id INTO folder_id;
    END IF;

    UPDATE public.publications_db
      SET mediateca_folder_id = folder_id
      WHERE publication_id = pub.publication_id;
  END LOOP;
END $$;

COMMIT;
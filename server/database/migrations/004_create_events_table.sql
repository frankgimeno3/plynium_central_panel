-- 004_create_events_table.sql
-- Tabla events. Idempotente.

CREATE TABLE IF NOT EXISTS events (
    id_fair VARCHAR(255) PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    country VARCHAR(255) DEFAULT '',
    main_description TEXT DEFAULT '',
    region VARCHAR(255) DEFAULT '',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    location VARCHAR(255) DEFAULT '',
    event_main_image VARCHAR(255) DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_start_date ON events (start_date);
CREATE INDEX IF NOT EXISTS events_region ON events (region);
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_main_image VARCHAR(255) DEFAULT '';

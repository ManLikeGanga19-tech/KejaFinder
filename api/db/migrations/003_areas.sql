CREATE TABLE IF NOT EXISTS areas (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  city                  TEXT NOT NULL DEFAULT 'Nairobi',
  tags                  TEXT[] NOT NULL DEFAULT '{}',
  hero_image_url        TEXT,
  local_insight         TEXT,
  area_score            NUMERIC(3,1) NOT NULL DEFAULT 0,
  safety_rating         INT NOT NULL DEFAULT 0,
  safety_label          TEXT,
  safety_notes          TEXT,
  cost_tier             TEXT,
  rent_range_min        INT,
  rent_range_max        INT,
  mobility_score        NUMERIC(4,1),
  walkability_score     NUMERIC(4,1),
  connectivity_mins     INT,
  connectivity_route    TEXT,
  investment_growth_pct NUMERIC(5,2),
  rental_yield_pct      NUMERIC(5,2),
  demand_score          TEXT,
  boundary              GEOMETRY(Polygon, 4326),
  centroid              GEOMETRY(Point, 4326),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_areas_slug ON areas(slug);
CREATE INDEX IF NOT EXISTS idx_areas_centroid ON areas USING GIST(centroid);
CREATE INDEX IF NOT EXISTS idx_areas_boundary ON areas USING GIST(boundary);

CREATE TABLE IF NOT EXISTS area_amenities (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  area_id      TEXT NOT NULL REFERENCES areas(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     amenity_category NOT NULL,
  subcategory  TEXT,
  distance_km  NUMERIC(5,2),
  rating       NUMERIC(2,1),
  is_top_tier  BOOLEAN NOT NULL DEFAULT false,
  address      TEXT,
  location     GEOMETRY(Point, 4326),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_area_amenities_area_id ON area_amenities(area_id);
CREATE INDEX IF NOT EXISTS idx_area_amenities_category ON area_amenities(area_id, category);

INSERT INTO schema_migrations (version) VALUES ('003_areas') ON CONFLICT DO NOTHING;

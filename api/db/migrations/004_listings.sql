CREATE TABLE IF NOT EXISTS listings (
  id                 TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug               TEXT NOT NULL UNIQUE,
  agent_id           TEXT NOT NULL REFERENCES agents(id),
  area_id            TEXT REFERENCES areas(id),
  title              TEXT NOT NULL,
  description_full   TEXT NOT NULL,
  description_teaser TEXT,
  property_type      property_type NOT NULL,
  price_kes          INT NOT NULL,
  price_period       TEXT NOT NULL DEFAULT 'monthly',
  bedrooms           INT NOT NULL,
  bathrooms          NUMERIC(3,1) NOT NULL,
  area_sqft          INT,
  floor              INT,
  total_floors       INT,
  furnishing         furnishing NOT NULL DEFAULT 'unfurnished',
  parking            INT NOT NULL DEFAULT 0,
  pets_allowed       BOOLEAN NOT NULL DEFAULT false,
  wifi               BOOLEAN NOT NULL DEFAULT false,
  amenities          TEXT[] NOT NULL DEFAULT '{}',
  city               TEXT NOT NULL DEFAULT 'Nairobi',
  address            TEXT,
  coordinates        GEOMETRY(Point, 4326),
  caretaker_name     TEXT,
  caretaker_phone    TEXT,
  available_from     DATE,
  deposit_months     INT NOT NULL DEFAULT 2,
  unlock_price_kes   INT NOT NULL DEFAULT 499,
  is_verified        BOOLEAN NOT NULL DEFAULT false,
  is_featured        BOOLEAN NOT NULL DEFAULT false,
  status             listing_status NOT NULL DEFAULT 'pending_review',
  moderation_note    TEXT,
  rejected_reason    TEXT,
  approved_at        TIMESTAMPTZ,
  published_at       TIMESTAMPTZ,
  view_count         INT NOT NULL DEFAULT 0,
  unlock_count       INT NOT NULL DEFAULT 0,
  search_vector      TSVECTOR,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price_kes);
CREATE INDEX IF NOT EXISTS idx_listings_bedrooms ON listings(bedrooms);
CREATE INDEX IF NOT EXISTS idx_listings_property_type ON listings(property_type);
CREATE INDEX IF NOT EXISTS idx_listings_featured ON listings(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_listings_agent ON listings(agent_id);
CREATE INDEX IF NOT EXISTS idx_listings_area ON listings(area_id);
CREATE INDEX IF NOT EXISTS idx_listings_coordinates ON listings USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_listings_title_trgm ON listings USING GIN(title gin_trgm_ops);

CREATE TABLE IF NOT EXISTS listing_photos (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id          TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  cloudinary_public_id TEXT NOT NULL,
  url                 TEXT NOT NULL,
  display_order       INT NOT NULL DEFAULT 0,
  is_cover            BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_listing_photos_listing ON listing_photos(listing_id);

CREATE TABLE IF NOT EXISTS listing_analytics (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  listing_id    TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  user_id       TEXT REFERENCES users(id),
  occurred_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata      JSONB
);
CREATE INDEX IF NOT EXISTS idx_analytics_listing_month ON listing_analytics(listing_id, occurred_at);

INSERT INTO schema_migrations (version) VALUES ('004_listings') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS payments (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id             TEXT NOT NULL REFERENCES users(id),
  listing_id          TEXT REFERENCES listings(id),
  payment_type        payment_type NOT NULL,
  status              payment_status NOT NULL DEFAULT 'pending',
  amount_kes          INT NOT NULL,
  merchant_request_id TEXT,
  checkout_request_id TEXT UNIQUE,
  mpesa_receipt_number TEXT UNIQUE,
  mpesa_phone         TEXT NOT NULL,
  result_code         INT,
  result_desc         TEXT,
  transaction_date    TIMESTAMPTZ,
  failure_reason      TEXT,
  idempotency_key     TEXT NOT NULL UNIQUE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_listing ON payments(listing_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_checkout ON payments(checkout_request_id);

CREATE TABLE IF NOT EXISTS unlocks (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id),
  listing_id  TEXT NOT NULL REFERENCES listings(id),
  payment_id  TEXT NOT NULL UNIQUE REFERENCES payments(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_unlocks_user ON unlocks(user_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_listing ON unlocks(listing_id);

CREATE TABLE IF NOT EXISTS leads (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id      TEXT NOT NULL REFERENCES users(id),
  listing_id   TEXT NOT NULL REFERENCES listings(id),
  agent_id     TEXT NOT NULL REFERENCES agents(id),
  payment_type payment_type NOT NULL,
  agent_notes  TEXT,
  contacted    BOOLEAN NOT NULL DEFAULT false,
  contacted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_leads_agent ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_listing ON leads(listing_id);

CREATE TABLE IF NOT EXISTS saved_listings (
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, listing_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_listings_user ON saved_listings(user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read_at);

CREATE TABLE IF NOT EXISTS push_tokens (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL UNIQUE,
  platform    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_push_tokens_user ON push_tokens(user_id);

INSERT INTO schema_migrations (version) VALUES ('005_payments') ON CONFLICT DO NOTHING;

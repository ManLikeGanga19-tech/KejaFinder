CREATE TABLE IF NOT EXISTS agents (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id                 TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name            TEXT NOT NULL,
  company_name            TEXT,
  bio                     TEXT,
  logo_url                TEXT,
  license_number          TEXT,
  national_id             TEXT,
  kyc_status              kyc_status NOT NULL DEFAULT 'not_submitted',
  kyc_verified_at         TIMESTAMPTZ,
  kyc_rejected_reason     TEXT,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  subscription_plan       subscription_plan NOT NULL DEFAULT 'starter',
  subscription_expires_at TIMESTAMPTZ,
  total_leads             INT NOT NULL DEFAULT 0,
  total_views             INT NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agents_kyc_status ON agents(kyc_status);
CREATE INDEX IF NOT EXISTS idx_agents_user ON agents(user_id);

CREATE TABLE IF NOT EXISTS agent_kyc_documents (
  id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id     TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  doc_type     TEXT NOT NULL,
  cloudinary_public_id TEXT NOT NULL,
  url          TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_agent_kyc_docs_agent ON agent_kyc_documents(agent_id);

INSERT INTO schema_migrations (version) VALUES ('002_agents') ON CONFLICT DO NOTHING;

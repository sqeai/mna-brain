-- Add source column to companies (inbound vs outbound deal origin)
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS source TEXT;

COMMENT ON COLUMN companies.source IS 'Deal origin: inbound or outbound';

CREATE INDEX IF NOT EXISTS idx_companies_source ON companies(source);

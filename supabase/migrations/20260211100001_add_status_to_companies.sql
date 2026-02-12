-- Migration: Add status column to companies table
-- Created: 2026-02-11

-- Add status column with NULL default, constrained to 'active' or 'dropped'
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT NULL
  CONSTRAINT companies_status_check CHECK (status IS NULL OR status IN ('active', 'dropped'));

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Add comment for the column
COMMENT ON COLUMN companies.status IS 'Company status: active, dropped, or NULL (unset)';

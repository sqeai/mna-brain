-- Migration: Add user role + company_assignees join table for multi-assignee
-- Created: 2026-04-27

ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT;

CREATE TABLE IF NOT EXISTS company_assignees (
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_assignees_company_id
  ON company_assignees(company_id);
CREATE INDEX IF NOT EXISTS idx_company_assignees_user_id
  ON company_assignees(user_id);

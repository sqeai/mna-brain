-- Migration: Create reset_password_tokens table
-- Created: 2026-04-23

CREATE TABLE IF NOT EXISTS reset_password_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reset_password_tokens_user_id
  ON reset_password_tokens(user_id);

ALTER TABLE reset_password_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access on reset_password_tokens"
  ON reset_password_tokens FOR SELECT TO public USING (true);
CREATE POLICY "Allow insert access on reset_password_tokens"
  ON reset_password_tokens FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow update access on reset_password_tokens"
  ON reset_password_tokens FOR UPDATE TO public USING (true);
CREATE POLICY "Allow delete access on reset_password_tokens"
  ON reset_password_tokens FOR DELETE TO public USING (true);

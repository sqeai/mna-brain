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

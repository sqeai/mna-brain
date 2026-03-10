-- Migration: Add favorite_companies column to users table
-- Created: 2026-03-10
-- Description: Stores an array of company IDs that the user has favorited

ALTER TABLE users ADD COLUMN IF NOT EXISTS favorite_companies JSONB DEFAULT '[]'::jsonb;

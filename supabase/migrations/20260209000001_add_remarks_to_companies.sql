-- Add remarks column to companies table
-- This column stores AI-generated remarks from market screening,
-- cross-matched against the investment thesis
ALTER TABLE companies ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Also add remarks to market_screening_results for pre-pipeline storage
ALTER TABLE market_screening_results ADD COLUMN IF NOT EXISTS remarks TEXT;

-- Migration: Remove market_screening_results table and add screening fields to companies
-- Companies from market screening will now be added directly to the companies table
-- with pipeline_stage = 'market_screening'

-- Add market-screening-specific column to companies table
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS thesis_content TEXT;

-- Update pipeline_stage comment to include market_screening
COMMENT ON COLUMN companies.pipeline_stage IS 'Current stage in the M&A pipeline (market_screening, L0, L1, L2, L3, L4, L5)';

-- Drop the market_screening_results table (match_score/match_reason columns are removed)
DROP TABLE IF EXISTS market_screening_results;

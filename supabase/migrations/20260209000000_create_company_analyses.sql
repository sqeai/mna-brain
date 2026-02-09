-- Migration: Create company_analyses table
-- Created: 2026-02-09
-- Purpose: Store AI-generated company analysis (AI Company Card) with 6 sections

-- Create company_analyses table
CREATE TABLE company_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  business_overview TEXT,
  business_model_summary TEXT,
  key_takeaways TEXT,
  investment_highlights TEXT,
  investment_risks TEXT,
  diligence_priorities TEXT,
  sources JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(company_id)
);

-- Create indexes
CREATE INDEX idx_company_analyses_company_id ON company_analyses(company_id);
CREATE INDEX idx_company_analyses_status ON company_analyses(status);
CREATE INDEX idx_company_analyses_created_at ON company_analyses(created_at);

-- Enable Row Level Security
ALTER TABLE company_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Allow read access on company_analyses" ON company_analyses FOR SELECT USING (true);
CREATE POLICY "Allow insert access on company_analyses" ON company_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on company_analyses" ON company_analyses FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on company_analyses" ON company_analyses FOR DELETE USING (true);

-- Add updated_at trigger
CREATE TRIGGER update_company_analyses_updated_at
  BEFORE UPDATE ON company_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

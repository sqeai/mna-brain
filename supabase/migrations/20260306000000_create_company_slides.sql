-- Migration: Create company_slides table
-- Created: 2026-03-06
-- Purpose: Persist slide builder slides per company

CREATE TABLE company_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  html TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_company_slides_company_id ON company_slides(company_id);
CREATE INDEX idx_company_slides_sort_order ON company_slides(company_id, sort_order);

-- Enable Row Level Security
ALTER TABLE company_slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access on company_slides" ON company_slides FOR SELECT USING (true);
CREATE POLICY "Allow insert access on company_slides" ON company_slides FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on company_slides" ON company_slides FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on company_slides" ON company_slides FOR DELETE USING (true);

-- updated_at trigger
CREATE TRIGGER update_company_slides_updated_at
  BEFORE UPDATE ON company_slides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Migration: Link domain tables to jobs
-- Created: 2026-04-22
-- Purpose: Add job_id FK on screenings, company_analyses, company_slides so
-- each result row can point to the job that produced it.

ALTER TABLE screenings
  ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

ALTER TABLE company_analyses
  ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

ALTER TABLE company_slides
  ADD COLUMN job_id UUID REFERENCES jobs(id) ON DELETE SET NULL;

CREATE INDEX idx_screenings_job_id ON screenings(job_id);
CREATE INDEX idx_company_analyses_job_id ON company_analyses(job_id);
CREATE INDEX idx_company_slides_job_id ON company_slides(job_id);

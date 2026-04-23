-- Migration: Create jobs and job_logs tables
-- Created: 2026-04-22
-- Purpose: Unified lifecycle tracking for async AI jobs (slide generation,
-- market screening, AI screening, company analysis). jobs owns status/timing;
-- job_logs records every state transition (via trigger) plus ad-hoc events.

CREATE TYPE job_type AS ENUM (
  'slide_generation',
  'market_screening',
  'ai_screening',
  'company_analysis'
);

CREATE TYPE job_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'timed_out'
);

CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type job_type NOT NULL,
  status job_status NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result JSONB,
  error TEXT,
  timeout_seconds INTEGER NOT NULL DEFAULT 240,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access on jobs" ON jobs FOR SELECT USING (true);
CREATE POLICY "Allow insert access on jobs" ON jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on jobs" ON jobs FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on jobs" ON jobs FOR DELETE USING (true);

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE job_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  from_status job_status,
  to_status job_status NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_job_logs_job_id ON job_logs(job_id);
CREATE INDEX idx_job_logs_created_at ON job_logs(created_at);

ALTER TABLE job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access on job_logs" ON job_logs FOR SELECT USING (true);
CREATE POLICY "Allow insert access on job_logs" ON job_logs FOR INSERT WITH CHECK (true);

-- Auto-log status transitions. INSERT records creation; UPDATE records every
-- status change. Ad-hoc event logs are inserted directly by application code.
CREATE OR REPLACE FUNCTION log_job_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO job_logs (job_id, from_status, to_status, message)
    VALUES (NEW.id, NULL, NEW.status, 'Job created');
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') AND (NEW.status IS DISTINCT FROM OLD.status) THEN
    INSERT INTO job_logs (job_id, from_status, to_status, message)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.error);
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_log_status_change
  AFTER INSERT OR UPDATE OF status ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION log_job_status_change();

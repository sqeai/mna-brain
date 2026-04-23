-- Migration: Rename minutes_of_meeting table to files and add file_type column
-- Created: 2026-02-09

-- ============================================
-- Rename Table
-- ============================================
ALTER TABLE minutes_of_meeting RENAME TO files;

-- ============================================
-- Add file_type column with default 'mom'
-- ============================================
ALTER TABLE files ADD COLUMN file_type VARCHAR NOT NULL DEFAULT 'mom';

-- ============================================
-- Rename Indexes
-- ============================================
ALTER INDEX idx_minutes_of_meeting_created_at RENAME TO idx_files_created_at;
ALTER INDEX idx_minutes_of_meeting_file_name RENAME TO idx_files_file_name;

-- ============================================
-- Recreate Trigger with new name
-- ============================================
DROP TRIGGER IF EXISTS update_minutes_of_meeting_updated_at ON files;
CREATE TRIGGER update_files_updated_at
  BEFORE UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Recreate RLS Policies with new names
-- ============================================
DROP POLICY IF EXISTS "Allow read access on minutes_of_meeting" ON files;
DROP POLICY IF EXISTS "Allow insert access on minutes_of_meeting" ON files;
DROP POLICY IF EXISTS "Allow update access on minutes_of_meeting" ON files;
DROP POLICY IF EXISTS "Allow delete access on minutes_of_meeting" ON files;

CREATE POLICY "Allow read access on files" ON files FOR SELECT USING (true);
CREATE POLICY "Allow insert access on files" ON files FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update access on files" ON files FOR UPDATE USING (true);
CREATE POLICY "Allow delete access on files" ON files FOR DELETE USING (true);

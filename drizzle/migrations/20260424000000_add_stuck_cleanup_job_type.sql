-- Migration: Add 'stuck_cleanup' to job_type enum
-- Created: 2026-04-24
-- Purpose: The in-app scheduler (triggered on cold start + job dispatch)
-- records each sweep as a regular job row so we get lifecycle tracking +
-- job_logs transitions for free. Adding the enum value lets those rows exist.

ALTER TYPE job_type ADD VALUE IF NOT EXISTS 'stuck_cleanup';

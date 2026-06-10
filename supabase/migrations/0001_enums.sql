-- ============================================================================
-- Migration 0001: Enum Types
-- ============================================================================
-- Dependencies: none
-- Run order:    1st
-- ============================================================================

BEGIN;

-- appointment_mode: matches TypeScript `SessionMode = "in_person" | "online"`
DO $$ BEGIN
  CREATE TYPE appointment_mode AS ENUM ('in_person', 'online');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- appointment_status: all 7 values used in codebase
--   pending → approved / cancelled / rescheduled / expired
--   approved → cancelled / completed / rescheduled
--   rescheduled → cancelled / completed
DO $$ BEGIN
  CREATE TYPE appointment_status AS ENUM (
    'pending',
    'approved',
    'declined',
    'cancelled',
    'completed',
    'rescheduled',
    'expired'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- thread_status: matches TypeScript `ThreadStatus = "active" | "detached"`
DO $$ BEGIN
  CREATE TYPE thread_status AS ENUM ('active', 'detached');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

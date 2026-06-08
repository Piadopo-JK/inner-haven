-- ============================================================================
-- Migration 0002: Shared Helper Functions
-- ============================================================================
-- Dependencies: none
-- Run order:    2nd
-- ============================================================================

BEGIN;

-- auto-update `updated_at` on any table with that column
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- normalize time to HH:MM (5 chars)
-- mirrors the TypeScript normalizeTime() which does value.slice(0, 5)
-- used by appointment conflict-check indexes and queries
CREATE OR REPLACE FUNCTION normalize_time_5(t time)
RETURNS text AS $$
  SELECT to_char(t, 'HH24:MI');
$$ LANGUAGE sql IMMUTABLE;

COMMIT;

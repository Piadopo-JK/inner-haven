-- ============================================================================
-- Migration 0011: Supabase Realtime
-- ============================================================================
-- Dependencies: 0005_appointments, 0008_anonymous_threads,
--               0009_anonymous_messages, 0010_notifications
-- Run order:    11th (last)
--
-- Registers tables for Supabase Realtime change-data-capture (postgres_changes).
-- Also enable Realtime in Dashboard → Database → Replication for each table.
-- ============================================================================

BEGIN;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE appointments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_threads;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE anonymous_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES (uncomment to run)
-- ============================================================================

-- SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' ORDER BY table_name;

-- SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' ORDER BY tablename, cmd, policyname;

-- SELECT tablename FROM pg_publication_tables
--   WHERE pubname = 'supabase_realtime' ORDER BY tablename;

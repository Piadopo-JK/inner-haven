-- ============================================================================
-- Migration 0008: anonymous_threads
-- ============================================================================
-- Dependencies: 0001_enums, 0004_counselors, auth.users
-- Run order:    8th
--
-- Encrypted anonymous chat threads. Student identity is masked.
-- One active thread per owner-counselor pair; detached threads are preserved.
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS anonymous_threads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id        uuid NOT NULL REFERENCES counselors(counselor_id) ON DELETE CASCADE,
  owner_auth_user_id  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status              thread_status NOT NULL DEFAULT 'active',
  expires_at          timestamptz,
  last_seen_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- 2. INDEXES

-- student thread listing
CREATE INDEX IF NOT EXISTS idx_threads_owner_status
  ON anonymous_threads (owner_auth_user_id, status);

-- counselor queue
CREATE INDEX IF NOT EXISTS idx_threads_counselor_status
  ON anonymous_threads (counselor_id, status);

-- only one active thread per owner-counselor pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_thread_owner_counselor
  ON anonymous_threads (owner_auth_user_id, counselor_id)
  WHERE status = 'active' AND owner_auth_user_id IS NOT NULL;

-- 3. TRIGGERS

DO $$ BEGIN
  CREATE TRIGGER trg_anonymous_threads_updated_at
    BEFORE UPDATE ON anonymous_threads
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. ROW-LEVEL SECURITY

ALTER TABLE anonymous_threads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own threads"
    ON anonymous_threads FOR SELECT
    USING (
      owner_auth_user_id = auth.uid()
      OR counselor_id IN (
        SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can create threads"
    ON anonymous_threads FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Thread participants can update threads"
    ON anonymous_threads FOR UPDATE
    USING (
      owner_auth_user_id = auth.uid()
      OR counselor_id IN (
        SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

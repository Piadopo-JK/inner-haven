-- ============================================================================
-- Migration 0009: anonymous_messages
-- ============================================================================
-- Dependencies: 0008_anonymous_threads, 0004_counselors
-- Run order:    9th
--
-- Individual messages within anonymous threads.
-- Sender is either 'student' or 'counselor'.
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS anonymous_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    uuid NOT NULL REFERENCES anonymous_threads(id) ON DELETE CASCADE,
  sender       text NOT NULL CHECK (sender IN ('student', 'counselor')),
  counselor_id uuid REFERENCES counselors(counselor_id) ON DELETE SET NULL,
  body         text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. INDEXES

CREATE INDEX IF NOT EXISTS idx_messages_thread
  ON anonymous_messages (thread_id, created_at);

-- 3. ROW-LEVEL SECURITY

ALTER TABLE anonymous_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view messages in their threads"
    ON anonymous_messages FOR SELECT
    USING (
      thread_id IN (
        SELECT id FROM anonymous_threads
        WHERE owner_auth_user_id = auth.uid()
           OR counselor_id IN (
             SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
           )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Thread participants can insert messages"
    ON anonymous_messages FOR INSERT
    WITH CHECK (
      thread_id IN (
        SELECT id FROM anonymous_threads
        WHERE owner_auth_user_id = auth.uid()
           OR counselor_id IN (
             SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
           )
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

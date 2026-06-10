-- ============================================================================
-- Migration 0007: session_notes
-- ============================================================================
-- Dependencies: 0005_appointments, 0004_counselors
-- Run order:    7th
--
-- One note per appointment (UNIQUE on appointment_id).
-- Only the counselor who wrote the note can read/edit it.
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS session_notes (
  note_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  uuid NOT NULL UNIQUE REFERENCES appointments(appointment_id) ON DELETE CASCADE,
  counselor_id    uuid REFERENCES counselors(counselor_id) ON DELETE SET NULL,
  note_content    text NOT NULL,
  recommendations text[] NOT NULL DEFAULT '{}'::text[],
  follow_up       text NOT NULL DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- 2. INDEXES

CREATE INDEX IF NOT EXISTS idx_session_notes_appointment
  ON session_notes (appointment_id);

-- 3. TRIGGERS

DO $$ BEGIN
  CREATE TRIGGER trg_session_notes_updated_at
    BEFORE UPDATE ON session_notes
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. ROW-LEVEL SECURITY

ALTER TABLE session_notes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Counselors can view their own session notes"
    ON session_notes FOR SELECT
    USING (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Counselors can insert session notes"
    ON session_notes FOR INSERT
    WITH CHECK (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Counselors can update their own session notes"
    ON session_notes FOR UPDATE
    USING (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

-- ============================================================================
-- Migration 0006: availability
-- ============================================================================
-- Dependencies: 0004_counselors
-- Run order:    6th
--
-- Supports two modes:
--   Rule-based:  start_time + end_time + slot_duration_minutes
--   Legacy:      discrete slot_time entries
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS availability (
  availability_id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  counselor_id         uuid NOT NULL REFERENCES counselors(counselor_id) ON DELETE CASCADE,
  day_of_week          integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time           time,          -- rule-based mode: window start
  end_time             time,          -- rule-based mode: window end
  slot_time            time,          -- legacy mode: discrete slot
  slot_duration_minutes integer CHECK (
                        slot_duration_minutes IS NULL
                        OR (slot_duration_minutes >= 15 AND slot_duration_minutes <= 180)
                      ),
  is_active            boolean DEFAULT true,
  breaks               jsonb DEFAULT '[]'::jsonb,  -- [{ "start": "12:00", "end": "13:00" }]
  created_at           timestamptz DEFAULT now()
);

-- 2. INDEXES

CREATE INDEX IF NOT EXISTS idx_availability_counselor
  ON availability (counselor_id, day_of_week);

-- 3. ROW-LEVEL SECURITY

ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone authenticated can view availability"
    ON availability FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Counselors can insert their own availability"
    ON availability FOR INSERT
    WITH CHECK (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Counselors can update their own availability"
    ON availability FOR UPDATE
    USING (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    )
    WITH CHECK (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Counselors can delete their own availability"
    ON availability FOR DELETE
    USING (
      counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

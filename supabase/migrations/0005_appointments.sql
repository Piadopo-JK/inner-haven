-- ============================================================================
-- Migration 0005: appointments
-- ============================================================================
-- Dependencies: 0001_enums, 0002_helpers, 0003_students, 0004_counselors
-- Run order:    5th
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       uuid NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
  counselor_id     uuid NOT NULL REFERENCES counselors(counselor_id) ON DELETE CASCADE,
  appointment_date date NOT NULL,
  appointment_time time NOT NULL,
  mode             appointment_mode NOT NULL,
  reason           text,
  status           appointment_status NOT NULL DEFAULT 'pending',
  meeting_link     text,              -- Google Meet URL (populated on approval for online)
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 2. INDEXES

-- student lookup
CREATE INDEX IF NOT EXISTS idx_appointments_student
  ON appointments (student_id, status);

-- counselor schedule lookup (active slots only)
CREATE INDEX IF NOT EXISTS idx_appointments_counselor
  ON appointments (counselor_id, appointment_date, appointment_time)
  WHERE status IN ('pending', 'approved', 'rescheduled');

-- date-based queries (dashboard, auto-expire)
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments (appointment_date, status);

-- conflict detection: unique active slot per counselor+date+time
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_active_slot
  ON appointments (counselor_id, appointment_date, normalize_time_5(appointment_time))
  WHERE status IN ('pending', 'approved', 'rescheduled');

-- conflict lookup performance mirror
CREATE INDEX IF NOT EXISTS idx_appointments_conflict_lookup
  ON appointments (counselor_id, appointment_date, normalize_time_5(appointment_time))
  WHERE status IN ('pending', 'approved', 'rescheduled');

-- 3. TRIGGERS

-- auto-update `updated_at`
DO $$ BEGIN
  CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- enforce valid status transitions
CREATE OR REPLACE FUNCTION enforce_appointment_status_transition()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status NOT IN ('pending') THEN
      RAISE EXCEPTION
        'Invalid initial appointment status: %. Must be pending.', NEW.status;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- non-status updates (e.g., editing reason) pass through
    IF OLD.status = NEW.status THEN
      RETURN NEW;
    END IF;

    CASE OLD.status
      WHEN 'pending' THEN
        IF NEW.status NOT IN ('approved', 'cancelled', 'rescheduled', 'expired') THEN
          RAISE EXCEPTION
            'Invalid transition: % → %. Pending → approved/cancelled/rescheduled/expired only.',
            OLD.status, NEW.status;
        END IF;
      WHEN 'approved' THEN
        IF NEW.status NOT IN ('cancelled', 'completed', 'rescheduled') THEN
          RAISE EXCEPTION
            'Invalid transition: % → %. Approved → cancelled/completed/rescheduled only.',
            OLD.status, NEW.status;
        END IF;
      WHEN 'rescheduled' THEN
        IF NEW.status NOT IN ('cancelled', 'completed') THEN
          RAISE EXCEPTION
            'Invalid transition: % → %. Rescheduled → cancelled/completed only.',
            OLD.status, NEW.status;
        END IF;
      WHEN 'declined' THEN
        RAISE EXCEPTION
          'Invalid transition: % → %. Declined appointments are terminal.', OLD.status;
      WHEN 'cancelled' THEN
        RAISE EXCEPTION
          'Invalid transition: % → %. Cancelled appointments are terminal.', OLD.status;
      WHEN 'completed' THEN
        RAISE EXCEPTION
          'Invalid transition: % → %. Completed appointments are terminal.', OLD.status;
      WHEN 'expired' THEN
        RAISE EXCEPTION
          'Invalid transition: % → %. Expired appointments are terminal.', OLD.status;
      ELSE
        RAISE EXCEPTION 'Unknown appointment status: %', OLD.status;
    END CASE;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_appointment_status_guard
    BEFORE INSERT OR UPDATE OF status ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION enforce_appointment_status_transition();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. ROW-LEVEL SECURITY

ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own appointments"
    ON appointments FOR SELECT
    USING (
      student_id IN (SELECT student_id FROM students WHERE auth_user_id = auth.uid())
      OR counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Students can insert appointments"
    ON appointments FOR INSERT
    WITH CHECK (
      student_id IN (SELECT student_id FROM students WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own appointments"
    ON appointments FOR UPDATE
    USING (
      student_id IN (SELECT student_id FROM students WHERE auth_user_id = auth.uid())
      OR counselor_id IN (SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

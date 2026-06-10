-- ============================================================================
-- Migration 0010: notifications
-- ============================================================================
-- Dependencies: 0005_appointments, 0008_anonymous_threads
-- Run order:    10th
--
-- Real-time notification delivery for both students and counselors.
-- Inserts are done server-side (service_role); users can only read/update read status.
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS notifications (
  notification_id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id        uuid NOT NULL,
  recipient_role      text NOT NULL CHECK (recipient_role IN ('student', 'counselor')),
  type                text NOT NULL,
  appointment_id      uuid REFERENCES appointments(appointment_id) ON DELETE SET NULL,
  anonymous_thread_id uuid REFERENCES anonymous_threads(id) ON DELETE SET NULL,
  message             text NOT NULL,
  read                boolean NOT NULL DEFAULT false,
  sent_at             timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- 2. INDEXES

-- recipient inbox (sorted by most recent)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications (recipient_role, recipient_id, sent_at DESC);

-- unread badge counts
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (recipient_role, recipient_id, read)
  WHERE read = false;

-- appointment-linked notifications
CREATE INDEX IF NOT EXISTS idx_notifications_appointment
  ON notifications (appointment_id)
  WHERE appointment_id IS NOT NULL;

-- thread-linked notifications
CREATE INDEX IF NOT EXISTS idx_notifications_thread
  ON notifications (anonymous_thread_id)
  WHERE anonymous_thread_id IS NOT NULL;

-- 3. ROW-LEVEL SECURITY

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (
      (recipient_role = 'student' AND recipient_id IN (
        SELECT student_id FROM students WHERE auth_user_id = auth.uid()
      ))
      OR
      (recipient_role = 'counselor' AND recipient_id IN (
        SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
      ))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can mark their own notifications as read"
    ON notifications FOR UPDATE
    USING (
      (recipient_role = 'student' AND recipient_id IN (
        SELECT student_id FROM students WHERE auth_user_id = auth.uid()
      ))
      OR
      (recipient_role = 'counselor' AND recipient_id IN (
        SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
      ))
    )
    WITH CHECK (
      (recipient_role = 'student' AND recipient_id IN (
        SELECT student_id FROM students WHERE auth_user_id = auth.uid()
      ))
      OR
      (recipient_role = 'counselor' AND recipient_id IN (
        SELECT counselor_id FROM counselors WHERE auth_user_id = auth.uid()
      ))
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

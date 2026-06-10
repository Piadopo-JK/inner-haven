-- ============================================================================
-- Migration 0003: students
-- ============================================================================
-- Dependencies: auth.users (Supabase-managed)
-- Run order:    3rd
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS students (
  student_id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  email        text NOT NULL UNIQUE,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. ROW-LEVEL SECURITY

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Students can view their own profile"
    ON students FOR SELECT
    USING (auth_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert students"
    ON students FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Students can update their own profile"
    ON students FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

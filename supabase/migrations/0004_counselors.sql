-- ============================================================================
-- Migration 0004: counselors
-- ============================================================================
-- Dependencies: auth.users (Supabase-managed)
-- Run order:    4th
--
-- NOTE: hero_image_url intentionally omitted — 0 code references.
--       Use hero_card_url for directory card images instead.
-- ============================================================================

BEGIN;

-- 1. TABLE

CREATE TABLE IF NOT EXISTS counselors (
  counselor_id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id         uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  email                text NOT NULL UNIQUE,
  specialization       text,
  office_room          text,
  about                text,
  avatar_url           text,
  hero_card_url        text,
  google_refresh_token text,              -- AES-256-GCM encrypted at rest
  google_connected_at  timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now()
);

-- 2. ROW-LEVEL SECURITY

ALTER TABLE counselors ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone authenticated can view counselors"
    ON counselors FOR SELECT
    USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Service can insert counselors"
    ON counselors FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Counselors can update their own profile"
    ON counselors FOR UPDATE
    USING (auth_user_id = auth.uid())
    WITH CHECK (auth_user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

COMMIT;

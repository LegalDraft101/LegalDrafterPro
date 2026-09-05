-- supabase/schemas/user_verification.sql
-- Based on section 3.3 of the agreed database documentation.

CREATE TABLE public.user_verification (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  email_authenticated boolean NOT NULL DEFAULT false,
  email_authenticated_at timestamptz,
  phone_authenticated boolean NOT NULL DEFAULT false,
  phone_authenticated_at timestamptz,
  last_authentication_at timestamptz
);

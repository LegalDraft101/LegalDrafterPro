-- supabase/schemas/user_preferences.sql
-- Based on section 3.2 of the agreed database documentation.

CREATE TABLE public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  language varchar NOT NULL,
  theme varchar NOT NULL DEFAULT 'System'
    CHECK (theme IN ('Light', 'Dark', 'System')),
  email_notifications boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  sms_notifications boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

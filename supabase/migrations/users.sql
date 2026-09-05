-- supabase/schemas/users.sql
-- Based on the agreed users table in the database documentation.
-- Supabase Auth owns authentication; this table stores application-level profile data.

CREATE TABLE public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  display_name varchar NOT NULL,
  email varchar UNIQUE NOT NULL,
  phone_number varchar NOT NULL,
  avatar varchar,
  job_title varchar,
  account_status varchar NOT NULL DEFAULT 'Active'
    CHECK (account_status IN ('Active', 'Suspended', 'Deactivated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);



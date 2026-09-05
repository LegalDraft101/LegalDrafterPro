-- supabase/schemas/user_addresses.sql
-- Based on section 3.4 of the agreed database documentation.

CREATE TABLE public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  address_line1 varchar NOT NULL,
  address_line2 varchar,
  city varchar NOT NULL,
  state varchar NOT NULL,
  postal_code varchar NOT NULL,
  country varchar NOT NULL,
  address_type varchar NOT NULL
    CHECK (address_type IN ('Home', 'Office', 'Other')),
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

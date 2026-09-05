-- supabase/schemas/user_delivery_addresses.sql
-- Based on section 3.5 of the agreed database documentation.
-- Reusable delivery-address records for orders to other people/locations.

CREATE TABLE public.user_delivery_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name varchar NOT NULL,
  phone varchar,
  alt_phone varchar,
  address_line1 varchar NOT NULL,
  address_line2 varchar,
  city varchar NOT NULL,
  state varchar NOT NULL,
  pincode varchar NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

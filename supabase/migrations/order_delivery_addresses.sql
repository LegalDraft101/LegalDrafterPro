-- supabase/schemas/order_delivery_addresses.sql
-- Based on section 5.4 of the agreed database documentation.
-- Historical delivery-address snapshot for a specific order.
-- This record must not change when a reusable user delivery address changes.

CREATE TABLE public.order_delivery_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  receiver_name varchar NOT NULL,
  phone varchar,
  alt_phone varchar,
  address_line1 varchar NOT NULL,
  address_line2 varchar,
  city varchar NOT NULL,
  state varchar NOT NULL,
  pincode varchar NOT NULL,
  delivery_service varchar,
  delivery_tracking_id varchar,
  dispatched_at timestamptz,
  delivery_status varchar,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

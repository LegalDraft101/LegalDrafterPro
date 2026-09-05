-- supabase/schemas/order_pricing.sql
-- Based on section 5.3 of the agreed database documentation.
-- One historical pricing snapshot per order in v1.

CREATE TABLE public.order_pricing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  state varchar NOT NULL,
  quantity numeric NOT NULL,
  denomination numeric NOT NULL,
  stamp_value numeric NOT NULL,
  service_charge numeric NOT NULL DEFAULT 0,
  shipping_charge numeric NOT NULL DEFAULT 0,
  gst numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL,
  currency varchar NOT NULL DEFAULT 'INR',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- supabase/schemas/payment_transactions.sql
-- Based on section 8.1 of the agreed database documentation.
-- Multiple payment attempts may exist for the same order.

CREATE TABLE public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  transaction_id varchar UNIQUE NOT NULL,
  gateway_transaction_id varchar,
  payment_gateway varchar NOT NULL,
  payment_method varchar NOT NULL,
  amount numeric NOT NULL,
  currency varchar NOT NULL DEFAULT 'INR',
  status varchar NOT NULL DEFAULT 'Initiated'
    CHECK (
      status IN (
        'Initiated',
        'Pending',
        'Success',
        'Failed',
        'Cancelled',
        'Refunded'
      )
    ),
  failure_reason varchar,
  gateway_response jsonb,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

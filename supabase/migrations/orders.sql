-- supabase/schemas/orders.sql
-- Based on section 5.1 of the agreed database documentation.
-- Note: organizations table is intentionally not created here; the FK below
-- assumes the skipped organizations schema will exist separately.

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id varchar UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL,
  template_id uuid,
  user_template_indicator boolean NOT NULL DEFAULT false, -- Indicates if the order was created using a user-uploaded template.
  stamp_id uuid,
  is_completed boolean NOT NULL DEFAULT false,
  status varchar NOT NULL DEFAULT 'Draft'
    CHECK (
      status IN (
        'Draft',
        'Pending Payment',
        'Payment Completed',
        'Document Generated',
        'Pending E-sign',
        'E-Signed',
        'Processing Stamp',
        'Dispatched',
        'Delivered',
        'Cancelled',
        'Failed'
      )
    ),
  first_party varchar,
  second_party varchar,
  purchased_by varchar,
  duty_paid_by varchar,
  purpose varchar,
  article_code varchar,
  consideration_price numeric,
  quantity numeric,
  denomination numeric,
  ref_id varchar,
  doorstep_delivery boolean NOT NULL DEFAULT false,
  user_input_details jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

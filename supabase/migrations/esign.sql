-- supabase/schemas/esign.sql
-- Based on section 7 of the agreed database documentation.
-- One row per signatory. Multiple rows may share the same uid.
-- Composite primary key: uid + signatory_email.
-- No signatory sequence is stored because sequential signing is not defined.

CREATE TABLE public.esign (
  uid varchar NOT NULL,
  signatory_email varchar NOT NULL,
  external_document_id varchar,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE RESTRICT,
  stamp_id uuid,
  sign_method varchar NOT NULL DEFAULT 'Aadhaar'
    CHECK (sign_method IN ('Aadhaar', 'Phone', 'Email', 'DSC')),
  document_name varchar NOT NULL,
  signatory_name varchar NOT NULL,
  signatory_phone varchar NOT NULL,
  signatory_status varchar NOT NULL DEFAULT 'Pending'
    CHECK (signatory_status IN ('Pending', 'Signed', 'Failed', 'Rejected')),
  sign_url varchar,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (uid, signatory_email)
);

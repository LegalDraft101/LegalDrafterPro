-- supabase/schemas/documents.sql
-- Based on section 6.1 of the agreed database documentation.
-- The document entity stores the durable/generated document reference.

CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_number varchar,
  document_url varchar NOT NULL,
  document_type varchar NOT NULL,
  status varchar NOT NULL DEFAULT 'Draft'
    CHECK (status IN (
      'Draft',
      'InProgress',
      'Generated',
      'Signed',
      'Archived',
      'Cancelled',
      'Failed'
    )),
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

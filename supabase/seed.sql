-- Seed Data for LegalDrafterPro Supabase Database

-- Initial Demo User
INSERT INTO public.users (id, name, email, phone, token_version, created_at)
VALUES (
  'usr_demo_1001',
  'Demo User',
  'demo@legaldrafterpro.com',
  '+919876543210',
  0,
  EXTRACT(EPOCH FROM NOW())::BIGINT * 1000
)
ON CONFLICT (id) DO NOTHING;

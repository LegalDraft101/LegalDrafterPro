-- Initial Schema Migration for LegalDrafterPro

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255) UNIQUE,
  google_id VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  password_salt VARCHAR(255),
  token_version INTEGER DEFAULT 0 NOT NULL,
  created_at BIGINT NOT NULL
);

-- Index on Users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- OTP Codes Table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  target_key VARCHAR(255) PRIMARY KEY,
  hash VARCHAR(255) NOT NULL,
  salt VARCHAR(255) NOT NULL,
  expires_at BIGINT NOT NULL,
  target VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  created_at BIGINT NOT NULL
);

-- Drafts / Documents Table
CREATE TABLE IF NOT EXISTS public.drafts (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) REFERENCES public.users(id) ON DELETE CASCADE,
  type_id VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path VARCHAR(512),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index on Drafts
CREATE INDEX IF NOT EXISTS idx_drafts_user_id ON public.drafts(user_id);
CREATE INDEX IF NOT EXISTS idx_drafts_type_id ON public.drafts(type_id);

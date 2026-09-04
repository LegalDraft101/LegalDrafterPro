import type { User } from './user.types';
import { supabase } from '../../config/supabase';

function nextId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    googleId: row.google_id || undefined,
    passwordHash: row.password_hash || undefined,
    passwordSalt: row.password_salt || undefined,
    tokenVersion: row.token_version,
    createdAt: Number(row.created_at),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;
  return mapRowToUser(data);
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  if (!phone) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) return null;
  return mapRowToUser(data);
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  if (!googleId) return null;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('google_id', googleId)
    .single();

  if (error || !data) return null;
  return mapRowToUser(data);
}

export async function findUserById(id: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return null;
  return mapRowToUser(data);
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User> {
  const existingEmail = await findUserByEmail(data.email);
  if (existingEmail) throw new Error('EMAIL_OR_PHONE_EXISTS');

  if (data.phone) {
    const existingPhone = await findUserByPhone(data.phone);
    if (existingPhone) throw new Error('EMAIL_OR_PHONE_EXISTS');
  }

  const newUser = {
    id: nextId(),
    name: data.name,
    email: data.email.toLowerCase(),
    phone: data.phone || null,
    google_id: data.googleId || null,
    password_hash: data.passwordHash || null,
    password_salt: data.passwordSalt || null,
    token_version: 0,
    created_at: Date.now(),
  };

  const { error } = await supabase.from('users').insert([newUser]);

  if (error) {
    if (error.code === '23505') throw new Error('EMAIL_OR_PHONE_EXISTS');
    throw new Error(`DB_ERROR: ${error.message}`);
  }

  return mapRowToUser(newUser);
}

export async function updateUserPassword(id: string, passwordHash: string, passwordSalt: string): Promise<void> {
  const user = await findUserById(id);
  if (!user) return;

  const { error } = await supabase
    .from('users')
    .update({
      password_hash: passwordHash,
      password_salt: passwordSalt,
      token_version: (user.tokenVersion || 0) + 1,
    })
    .eq('id', id);

  if (error) throw new Error(`DB_ERROR: ${error.message}`);
}

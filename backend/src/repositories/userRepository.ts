import type { User } from '../types';
import { supabase } from '../utils/supabase';

export interface IUserRepo {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User>;
  updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<void>;
}

function nextId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// Helper to map DB row to User type
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
    createdAt: Number(row.created_at)
  };
}

export const userRepo: IUserRepo = {
  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !data) return null;
    return mapRowToUser(data);
  },

  async findByPhone(phone: string): Promise<User | null> {
    if (!phone) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) return null;
    return mapRowToUser(data);
  },

  async findByGoogleId(googleId: string): Promise<User | null> {
    if (!googleId) return null;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('google_id', googleId)
      .single();

    if (error || !data) return null;
    return mapRowToUser(data);
  },

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return mapRowToUser(data);
  },

  async create(data: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User> {
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) throw new Error('EMAIL_OR_PHONE_EXISTS');

    if (data.phone) {
      const existingPhone = await this.findByPhone(data.phone);
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
      created_at: Date.now()
    };

    const { error } = await supabase
      .from('users')
      .insert([newUser]);

    if (error) {
      if (error.code === '23505') throw new Error('EMAIL_OR_PHONE_EXISTS');
      throw new Error(`DB_ERROR: ${error.message}`);
    }

    return mapRowToUser(newUser);
  },

  async updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) return;

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        password_salt: passwordSalt,
        token_version: (user.tokenVersion || 0) + 1
      })
      .eq('id', id);

    if (error) throw new Error(`DB_ERROR: ${error.message}`);
  },
};

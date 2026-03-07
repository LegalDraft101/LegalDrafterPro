/**
 * User repository (in-memory). TODO: replace with DB.
 */

import type { User } from '../types';

export interface IUserRepo {
  findByEmail(email: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByGoogleId(googleId: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User>;
  updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<void>;
}

const store = new Map<string, User>();
const byEmail = new Map<string, string>();
const byPhone = new Map<string, string>();
const byGoogleId = new Map<string, string>();

function nextId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export const userRepo: IUserRepo = {
  async findByEmail(email: string): Promise<User | null> {
    const id = byEmail.get(email.toLowerCase());
    return id ? store.get(id) ?? null : null;
  },
  async findByPhone(phone: string): Promise<User | null> {
    const id = byPhone.get(phone);
    return id ? store.get(id) ?? null : null;
  },
  async findByGoogleId(googleId: string): Promise<User | null> {
    const id = byGoogleId.get(googleId);
    return id ? store.get(id) ?? null : null;
  },
  async findById(id: string): Promise<User | null> {
    return store.get(id) ?? null;
  },
  async create(data: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User> {
    if (byEmail.get(data.email.toLowerCase())) throw new Error('EMAIL_OR_PHONE_EXISTS');
    if (byPhone.get(data.phone)) throw new Error('EMAIL_OR_PHONE_EXISTS');
    const user: User = {
      id: nextId(),
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      googleId: data.googleId,
      passwordHash: data.passwordHash,
      passwordSalt: data.passwordSalt,
      tokenVersion: 0,
      createdAt: Date.now(),
    };
    store.set(user.id, user);
    byEmail.set(user.email, user.id);
    byPhone.set(user.phone, user.id);
    if (user.googleId) byGoogleId.set(user.googleId, user.id);
    return user;
  },
  async updatePassword(id: string, passwordHash: string, passwordSalt: string): Promise<void> {
    const user = store.get(id);
    if (!user) return;
    user.passwordHash = passwordHash;
    user.passwordSalt = passwordSalt;
    user.tokenVersion = (user.tokenVersion ?? 0) + 1;
    store.set(id, user);
  },
};

/**
 * Services: user data access methods.
 * Note: OTP, Twilio, Nodemailer, and Passport logic was removed globally 
 * as Firebase now handles authentication directly.
 */

import { userRepo } from './repositories/userRepository';
import { normalizeEmail, normalizePhone } from './utils';
import type { User } from './types';

export async function findUserByEmail(email: string): Promise<User | null> {
  return userRepo.findByEmail(normalizeEmail(email));
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  return userRepo.findByPhone(normalizePhone(phone));
}

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  return userRepo.findByGoogleId(googleId);
}

export async function findUserById(id: string): Promise<User | null> {
  return userRepo.findById(id);
}

export async function createUser(data: {
  name: string;
  email: string;
  phone: string;
  googleId?: string;
}): Promise<User> {
  const base = {
    name: data.name.trim(),
    email: normalizeEmail(data.email),
    phone: normalizePhone(data.phone),
    googleId: data.googleId,
  };
  return userRepo.create(base);
}

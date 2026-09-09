import type { User } from './user.types';
import { prisma } from '../../lib/prisma';
import type { User as PrismaUser } from '@prisma/client';

function nextId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function mapRowToUser(dbUser: PrismaUser): User {
  return {
    id: dbUser.id,
    name: dbUser.name || dbUser.displayName || `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim() || 'User',
    email: dbUser.email || undefined,
    phone: dbUser.phone || '',
    firebaseUid: dbUser.firebaseUid || undefined,
    authMethod: dbUser.authMethod,
    passwordHash: dbUser.passwordHash || undefined,
    passwordSalt: dbUser.passwordSalt || undefined,
    tokenVersion: dbUser.tokenVersion,
    accountStatus: dbUser.accountStatus,
    createdAt: dbUser.createdAt ? dbUser.createdAt.getTime() : Date.now(),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!dbUser) return null;
  return mapRowToUser(dbUser);
}

export async function findUserByPhone(phone: string): Promise<User | null> {
  if (!phone) return null;
  const dbUser = await prisma.user.findFirst({
    where: { phone },
  });

  if (!dbUser) return null;
  return mapRowToUser(dbUser);
}

export async function findUserByFirebaseUid(firebaseUid: string): Promise<User | null> {
  if (!firebaseUid) return null;
  const dbUser = await prisma.user.findFirst({
    where: { firebaseUid },
  });

  if (!dbUser) return null;
  return mapRowToUser(dbUser);
}

export async function findUserById(id: string): Promise<User | null> {
  const dbUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!dbUser) return null;
  return mapRowToUser(dbUser);
}

export async function linkFirebaseUid(id: string, firebaseUid: string): Promise<User> {
  const dbUser = await prisma.user.update({
    where: { id },
    data: { firebaseUid },
  });
  return mapRowToUser(dbUser);
}

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User> {
  if (data.email) {
    const existingEmail = await findUserByEmail(data.email);
    if (existingEmail) throw new Error('EMAIL_OR_PHONE_EXISTS');
  }

  if (data.phone) {
    const existingPhone = await findUserByPhone(data.phone);
    if (existingPhone) throw new Error('EMAIL_OR_PHONE_EXISTS');
  }

  try {
    const nameParts = data.name.trim().split(/\s+/);
    const created = await prisma.user.create({
      data: {
        id: nextId(),
        name: data.name,
        firstName: nameParts[0] || null,
        lastName: nameParts.length > 1 ? nameParts.slice(1).join(' ') : null,
        displayName: data.name,
        email: data.email ? data.email.toLowerCase() : null,
        phone: data.phone || null,
        firebaseUid: data.firebaseUid || null,
        authMethod: data.authMethod || 'GOOGLE_FIREBASE',
        passwordHash: data.passwordHash || null,
        passwordSalt: data.passwordSalt || null,
        tokenVersion: 0,
        preferences: {
          create: { language: 'en', theme: 'System' },
        },
      },
    });

    return mapRowToUser(created);
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new Error('EMAIL_OR_PHONE_EXISTS');
    }
    throw new Error(`DB_ERROR: ${error.message}`);
  }
}

export async function updateUserPassword(id: string, passwordHash: string, passwordSalt: string): Promise<void> {
  const user = await findUserById(id);
  if (!user) return;

  try {
    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        passwordSalt,
        tokenVersion: { increment: 1 },
      },
    });
  } catch (error: any) {
    throw new Error(`DB_ERROR: ${error.message}`);
  }
}

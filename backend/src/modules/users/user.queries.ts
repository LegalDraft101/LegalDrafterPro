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
    email: dbUser.email,
    phone: dbUser.phone || '',
    googleId: dbUser.googleId || undefined,
    passwordHash: dbUser.passwordHash || undefined,
    passwordSalt: dbUser.passwordSalt || undefined,
    tokenVersion: dbUser.tokenVersion,
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

export async function findUserByGoogleId(googleId: string): Promise<User | null> {
  if (!googleId) return null;
  const dbUser = await prisma.user.findFirst({
    where: { googleId },
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

export async function createUser(data: Omit<User, 'id' | 'createdAt' | 'tokenVersion'>): Promise<User> {
  const existingEmail = await findUserByEmail(data.email);
  if (existingEmail) throw new Error('EMAIL_OR_PHONE_EXISTS');

  if (data.phone) {
    const existingPhone = await findUserByPhone(data.phone);
    if (existingPhone) throw new Error('EMAIL_OR_PHONE_EXISTS');
  }

  try {
    const created = await prisma.user.create({
      data: {
        id: nextId(),
        name: data.name,
        displayName: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone || null,
        googleId: data.googleId || null,
        passwordHash: data.passwordHash || null,
        passwordSalt: data.passwordSalt || null,
        tokenVersion: 0,
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

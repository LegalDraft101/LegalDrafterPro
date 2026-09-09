import type { Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { consumeOtp, createOtpCode, hashSecret } from '../auth/local-auth';
import { sendEmailOtp } from '../../services/email.service';
import { isValidE164, isValidName, normalizeEmail, normalizePhone } from '../../utils/helpers';
import { toApiUser } from '../users/user.types';

const OTP_TTL_MS = 10 * 60 * 1000;
type AddressKind = 'personal' | 'delivery';

function userId(req: AuthRequest): string {
  if (!req.user?.sub) throw new Error('Unauthorized');
  return req.user.sub;
}

async function profileFor(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { verification: true, preferences: true, addresses: true, deliveryAddresses: true },
  });
  if (!user) return null;
  const preferences = await prisma.userPreferences.upsert({
    where: { userId: id },
    create: { userId: id, language: 'en', theme: 'System' },
    update: { language: 'en', theme: 'System' },
  });
  return {
    user: toApiUser({ ...user, firstName: user.firstName || undefined, lastName: user.lastName || undefined, displayName: user.displayName || undefined, accountStatus: user.accountStatus || undefined, email: user.email || undefined, phone: user.phone || '' }),
    profile: { jobTitle: user.jobTitle || '', avatar: user.avatar || '' },
    preferences: {
      language: preferences.language,
      theme: preferences.theme,
      emailNotifications: preferences.emailNotifications,
      marketingEmails: preferences.marketingEmails,
      whatsappEnabled: preferences.whatsappEnabled,
      smsNotifications: preferences.smsNotifications,
    },
    verification: {
      emailVerified: user.verification?.emailAuthenticated ?? false,
      phoneVerified: user.verification?.phoneAuthenticated ?? false,
      emailVerifiedAt: user.verification?.emailAuthenticatedAt?.toISOString() ?? null,
      phoneVerifiedAt: user.verification?.phoneAuthenticatedAt?.toISOString() ?? null,
    },
    addresses: user.addresses,
    deliveryAddresses: user.deliveryAddresses,
  };
}

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await profileFor(userId(req));
    if (!profile) { res.status(404).json({ error: 'User not found' }); return; }
    res.json(profile);
  } catch (error) { next(error); }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : undefined;
    const firstName = typeof req.body.firstName === 'string' ? req.body.firstName.trim() : undefined;
    const lastName = typeof req.body.lastName === 'string' ? req.body.lastName.trim() : undefined;
    const displayName = typeof req.body.displayName === 'string' ? req.body.displayName.trim() : undefined;
    const resolvedName = name ?? [firstName, lastName].filter(Boolean).join(' ').trim();
    if (name === undefined && (firstName !== undefined || lastName !== undefined) && !isValidName(resolvedName)) { res.status(400).json({ error: 'First name and last name must form a valid name.' }); return; }
    if (name !== undefined && !isValidName(name)) { res.status(400).json({ error: 'Name must be between 2 and 50 characters.' }); return; }
    const data: { name?: string; firstName?: string | null; lastName?: string | null; displayName?: string | null; jobTitle?: string | null; avatar?: string | null } = {};
    if (resolvedName) {
      const parts = resolvedName.split(/\s+/);
      data.name = resolvedName;
      data.firstName = firstName ?? parts[0] ?? null;
      data.lastName = lastName ?? (parts.length > 1 ? parts.slice(1).join(' ') : null);
    } else {
      if (firstName !== undefined) data.firstName = firstName || null;
      if (lastName !== undefined) data.lastName = lastName || null;
    }
    if (displayName !== undefined) data.displayName = displayName || null;
    if (typeof req.body.jobTitle === 'string') data.jobTitle = req.body.jobTitle.trim() || null;
    if (typeof req.body.avatar === 'string') data.avatar = req.body.avatar.trim() || null;
    await prisma.user.update({ where: { id: userId(req) }, data });
    if (req.body.preferences && typeof req.body.preferences === 'object') {
      const preferences = req.body.preferences as Record<string, unknown>;
      await prisma.userPreferences.upsert({
        where: { userId: userId(req) },
        create: { userId: userId(req), language: 'en', theme: 'System', emailNotifications: preferences.emailNotifications !== false, marketingEmails: preferences.marketingEmails === true, whatsappEnabled: preferences.whatsappEnabled === true, smsNotifications: preferences.smsNotifications === true },
        update: { language: 'en', theme: 'System', ...(typeof preferences.emailNotifications === 'boolean' ? { emailNotifications: preferences.emailNotifications } : {}), ...(typeof preferences.marketingEmails === 'boolean' ? { marketingEmails: preferences.marketingEmails } : {}), ...(typeof preferences.whatsappEnabled === 'boolean' ? { whatsappEnabled: preferences.whatsappEnabled } : {}), ...(typeof preferences.smsNotifications === 'boolean' ? { smsNotifications: preferences.smsNotifications } : {}) },
      });
    }
    const profile = await profileFor(userId(req));
    res.json(profile);
  } catch (error) { next(error); }
}

function addressKind(value: unknown): AddressKind | null {
  return value === 'personal' || value === 'delivery' ? value : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function deliveryPhone(value: unknown): string {
  const phone = normalizePhone(text(value));
  return /^\d{10}$/.test(phone) ? `+91${phone}` : phone;
}

function validateAddress(body: Record<string, unknown>, kind: AddressKind): string | null {
  const required = kind === 'personal'
    ? ['addressLine1', 'city', 'state', 'postalCode', 'country']
    : ['name', 'addressLine1', 'city', 'state', 'pincode'];
  if (required.some((key) => !text(body[key]))) return 'All required address fields must be provided.';
  if (kind === 'delivery' && body.phone && !isValidE164(deliveryPhone(body.phone))) return 'Delivery phone must be a valid mobile number.';
  return null;
}

async function makeAddressDefault(userId: string, addressId: string, kind: AddressKind): Promise<void> {
  await prisma.$transaction(async (tx) => {
    if (kind === 'personal') {
      await tx.userAddress.updateMany({ where: { userId }, data: { isPrimary: false } });
      await tx.userAddress.updateMany({ where: { id: addressId, userId }, data: { isPrimary: true } });
    } else {
      await tx.userDeliveryAddress.updateMany({ where: { userId }, data: { isDefault: false } });
      await tx.userDeliveryAddress.updateMany({ where: { id: addressId, userId }, data: { isDefault: true } });
    }
  });
}

export async function createAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = addressKind(req.body.kind);
    if (!kind) { res.status(400).json({ error: 'Address kind must be personal or delivery.' }); return; }
    const id = userId(req);
    const validationError = validateAddress(req.body, kind);
    if (validationError) { res.status(400).json({ error: validationError }); return; }
    if (kind === 'personal') {
      const existing = await prisma.userAddress.findFirst({ where: { userId: id } });
      const address = existing
        ? await prisma.userAddress.update({ where: { id: existing.id }, data: { addressLine1: text(req.body.addressLine1), addressLine2: text(req.body.addressLine2) || null, city: text(req.body.city), state: text(req.body.state), postalCode: text(req.body.postalCode), country: text(req.body.country) || 'India', addressType: text(req.body.addressType) || 'home' } })
        : await prisma.userAddress.create({ data: { userId: id, addressLine1: text(req.body.addressLine1), addressLine2: text(req.body.addressLine2) || null, city: text(req.body.city), state: text(req.body.state), postalCode: text(req.body.postalCode), country: text(req.body.country) || 'India', addressType: text(req.body.addressType) || 'home', isPrimary: true } });
      if (req.body.isPrimary || !existing) await makeAddressDefault(id, address.id, kind);
      res.status(existing ? 200 : 201).json(address);
      return;
    }
    const hasDeliveryAddress = await prisma.userDeliveryAddress.count({ where: { userId: id } });
    const address = await prisma.userDeliveryAddress.create({ data: { userId: id, name: text(req.body.name), phone: deliveryPhone(req.body.phone) || null, altPhone: deliveryPhone(req.body.altPhone) || null, addressLine1: text(req.body.addressLine1), addressLine2: text(req.body.addressLine2) || null, city: text(req.body.city), state: text(req.body.state), pincode: text(req.body.pincode || req.body.postalCode), isDefault: hasDeliveryAddress === 0 || Boolean(req.body.isDefault) } });
    if (address.isDefault) await makeAddressDefault(id, address.id, kind);
    res.status(201).json(address);
  } catch (error) { next(error); }
}

export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = addressKind(req.body.kind);
    if (!kind) { res.status(400).json({ error: 'Address kind must be personal or delivery.' }); return; }
    const id = userId(req);
    const addressId = String(req.params.id);
    const validationError = validateAddress(req.body, kind);
    if (validationError) { res.status(400).json({ error: validationError }); return; }
    if (kind === 'personal') {
      const address = await prisma.userAddress.updateMany({ where: { id: addressId, userId: id }, data: { addressLine1: text(req.body.addressLine1), addressLine2: text(req.body.addressLine2) || null, city: text(req.body.city), state: text(req.body.state), postalCode: text(req.body.postalCode), country: text(req.body.country) || 'India', addressType: text(req.body.addressType) || 'home' } });
      if (!address.count) { res.status(404).json({ error: 'Address not found.' }); return; }
      if (req.body.isPrimary) await makeAddressDefault(id, addressId, kind);
    } else {
      const address = await prisma.userDeliveryAddress.updateMany({ where: { id: addressId, userId: id }, data: { name: text(req.body.name), phone: deliveryPhone(req.body.phone) || null, altPhone: deliveryPhone(req.body.altPhone) || null, addressLine1: text(req.body.addressLine1), addressLine2: text(req.body.addressLine2) || null, city: text(req.body.city), state: text(req.body.state), pincode: text(req.body.pincode || req.body.postalCode) } });
      if (!address.count) { res.status(404).json({ error: 'Address not found.' }); return; }
      if (req.body.isDefault) await makeAddressDefault(id, addressId, kind);
    }
    res.json(await profileFor(id));
  } catch (error) { next(error); }
}

export async function setDefaultAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = addressKind(req.body.kind);
    if (!kind) { res.status(400).json({ error: 'Address kind must be personal or delivery.' }); return; }
    const id = userId(req);
    const addressId = String(req.params.id);
    const exists = kind === 'personal'
      ? await prisma.userAddress.count({ where: { id: addressId, userId: id } })
      : await prisma.userDeliveryAddress.count({ where: { id: addressId, userId: id } });
    if (!exists) { res.status(404).json({ error: 'Address not found.' }); return; }
    await makeAddressDefault(id, addressId, kind);
    res.json(await profileFor(id));
  } catch (error) { next(error); }
}

export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const kind = addressKind(req.query.kind);
    if (!kind) { res.status(400).json({ error: 'Address kind must be personal or delivery.' }); return; }
    const id = userId(req);
    const addressId = String(req.params.id);
    if (kind === 'personal') await prisma.userAddress.deleteMany({ where: { id: addressId, userId: id } });
    else await prisma.userDeliveryAddress.deleteMany({ where: { id: addressId, userId: id } });
    res.status(204).send();
  } catch (error) { next(error); }
}

export async function requestVerification(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const channel = req.body.channel === 'email' || req.body.channel === 'phone' ? req.body.channel : null;
    if (!channel) { res.status(400).json({ error: 'Verification channel must be email or phone.' }); return; }
    if (channel === 'phone') { res.status(400).json({ error: 'Use Firebase Phone Auth for phone verification.' }); return; }
    const user = await prisma.user.findUnique({ where: { id: userId(req) } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const target = channel === 'email' ? normalizeEmail(text(req.body.email) || user.email || '') : deliveryPhone(req.body.phone || user.phone || '');
    if (!target || (channel === 'email' ? !isValidEmailTarget(target) : !isValidE164(target))) { res.status(400).json({ error: `A valid ${channel} is required before verification.` }); return; }
    const duplicate = channel === 'email'
      ? await prisma.user.findFirst({ where: { email: target, NOT: { id: user.id } } })
      : await prisma.user.findFirst({ where: { phone: target, NOT: { id: user.id } } });
    if (duplicate) { res.status(409).json({ error: `This ${channel} is already linked to another account.` }); return; }
    const code = createOtpCode();
    const secret = hashSecret(code);
    const record = await prisma.authOtp.create({ data: { userId: user.id, target, purpose: channel === 'email' ? 'PROFILE_EMAIL_VERIFICATION' : 'PROFILE_PHONE_VERIFICATION', codeHash: secret.hash, codeSalt: secret.salt, expiresAt: new Date(Date.now() + OTP_TTL_MS) } });
    await sendEmailOtp(target, code);
    res.status(202).json({ status: 'otp_sent', otpId: record.id, channel });
  } catch (error) { next(error); }
}

function isValidEmailTarget(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value));
}

export async function verifyContact(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const channel = req.body.channel === 'email' || req.body.channel === 'phone' ? req.body.channel : null;
    if (!channel || typeof req.body.otpId !== 'string' || typeof req.body.code !== 'string') { res.status(400).json({ error: 'Channel, OTP id, and code are required.' }); return; }
    const result = await consumeOtp(req.body.otpId, req.body.code);
    const expectedPurpose = channel === 'email' ? 'PROFILE_EMAIL_VERIFICATION' : 'PROFILE_PHONE_VERIFICATION';
    if (!result.valid || !result.record || result.record.userId !== userId(req) || result.record.purpose !== expectedPurpose) { res.status(400).json({ error: 'Invalid or expired verification code.' }); return; }
    const now = new Date();
    const target = result.record.target;
    if (channel === 'email') {
      await prisma.user.update({ where: { id: userId(req) }, data: { email: normalizeEmail(target) } });
    } else {
      await prisma.user.update({ where: { id: userId(req) }, data: { phone: target } });
    }
    await prisma.userVerification.upsert({ where: { userId: userId(req) }, create: { userId: userId(req), emailAuthenticated: channel === 'email', emailAuthenticatedAt: channel === 'email' ? now : null, phoneAuthenticated: channel === 'phone', phoneAuthenticatedAt: channel === 'phone' ? now : null, lastAuthenticationAt: now }, update: channel === 'email' ? { emailAuthenticated: true, emailAuthenticatedAt: now, lastAuthenticationAt: now } : { phoneAuthenticated: true, phoneAuthenticatedAt: now, lastAuthenticationAt: now } });
    res.json({ status: 'verified', channel });
  } catch (error) { next(error); }
}

export async function syncFirebasePhone(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const firebaseUser = (req as any).firebaseUser as { phone_number?: string; phone_number_verified?: boolean } | undefined;
    if (!firebaseUser?.phone_number || !firebaseUser.phone_number_verified) {
      res.status(400).json({ error: 'Firebase has not verified a phone number for this account.' });
      return;
    }
    const phone = deliveryPhone(firebaseUser.phone_number);
    if (!isValidE164(phone)) { res.status(400).json({ error: 'Firebase returned an invalid phone number.' }); return; }
    const duplicate = await prisma.user.findFirst({ where: { phone, NOT: { id: userId(req) } } });
    if (duplicate) { res.status(409).json({ error: 'This phone number is already linked to another account.' }); return; }
    const now = new Date();
    await prisma.user.update({ where: { id: userId(req) }, data: { phone } });
    await prisma.userVerification.upsert({ where: { userId: userId(req) }, create: { userId: userId(req), phoneAuthenticated: true, phoneAuthenticatedAt: now, lastAuthenticationAt: now }, update: { phoneAuthenticated: true, phoneAuthenticatedAt: now, lastAuthenticationAt: now } });
    res.json({ status: 'verified', channel: 'phone' });
  } catch (error) { next(error); }
}
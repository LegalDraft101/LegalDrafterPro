import nodemailer from 'nodemailer';
import { env } from '../config/env';

export async function sendEmailOtp(to: string, code: string): Promise<void> {
  if (!env.GMAIL_CLIENT_ID || !env.GMAIL_CLIENT_SECRET || !env.GMAIL_REFRESH_TOKEN || !env.GMAIL_SENDER) {
    throw new Error('Email OTP delivery is not configured');
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: env.GMAIL_SENDER,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
    },
  });
  await transporter.sendMail({
    from: env.EMAIL_FROM || env.GMAIL_SENDER,
    to,
    subject: 'Your Legal Drafter verification code',
    text: `Your verification code is:\n\n${code}\n\nThis code expires in 5 minutes.\n\nIf you did not request this code, you can ignore this email.`,
  });
}
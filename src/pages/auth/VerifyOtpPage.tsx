import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Card,
  Title2,
  Text,
} from '@fluentui/react-components';
import { usePageStyles } from './authStyles';
import { auth } from '../../lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const verifySchema = z.object({
  code: z.string().trim().length(6, 'Enter 6-digit code'),
});

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const p = usePageStyles();

  const state = location.state as {
    phone?: string;
  } | null;

  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);

  const phone = state?.phone ?? '';

  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { code: '' }
  });

  useEffect(() => {
    if (!phone || !(window as any).confirmationResult) {
      toast.error('Missing phone connection. Start from login.');
      navigate('/login');
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setLoading(true);
    try {
      const cr = (window as any).confirmationResult;
      if (!cr) throw new Error('No active verification session.');
      await cr.confirm(data.code);
      toast.success('Signed in.');
      navigate('/account', { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid or expired code(s)');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'resend-recaptcha', { size: 'invisible' });
      }
      const confirmationResult = await signInWithPhoneNumber(auth, phone, (window as any).recaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;

      toast.success('Code sent again.');
      setResendCooldown(60);
    } catch (e: any) {
      toast.error(e.message || 'Resend failed');
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const maskedTarget = phone.length <= 4 ? '****' : phone.slice(0, 2) + '****' + phone.slice(-2);

  return (
    <div className={p.verifyWrapper}>
      <Card className={p.verifyCard}>
        <Title2 className={p.verifyHeading}>Verify your account</Title2>
        <Text className={p.verifySubheading}>
          We sent a 6-digit code to {maskedTarget}
        </Text>
        <form onSubmit={handleSubmit(onSubmit)} className={p.verifyForm}>
          <div className={p.verifyInputGroup}>
            <label htmlFor="code" style={{ fontSize: 13, fontWeight: 500 }}>Verification code</label>
            <Input id="code" type="text" maxLength={6} placeholder="000000" autoComplete="one-time-code" {...register('code', { onBlur: () => setFocus('code') })} />
            {errors.code && <span role="alert" className={p.verifyError}>{errors.code.message}</span>}
          </div>
          <div id="resend-recaptcha"></div>
          <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Verifying…' : 'Verify'}
          </Button>
          <Button appearance="outline" onClick={onResend} disabled={resendCooldown > 0 || loading} style={{ width: '100%' }}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
          </Button>
        </form>
        <div className={p.verifyBackLinks}>
          <Link to="/" className={p.verifyBackLink}>← Back to home</Link>
          <span> · </span>
          <Link to="/login" className={p.verifyBackLink}>Back to login</Link>
        </div>
      </Card>
    </div>
  );
}

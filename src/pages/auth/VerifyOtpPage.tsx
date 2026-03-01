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
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../api/index';
import { usePageStyles } from './authStyles';

const verifySchema = z.object({
  code: z.string().length(6, 'Enter 6-digit code').regex(/^\d{6}$/, 'Digits only'),
});

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const p = usePageStyles();
  const state = location.state as { emailOrPhone?: string; channel?: 'email' | 'phone'; email?: string; phone?: string } | null;
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const channel = state?.channel ?? (state?.emailOrPhone?.includes('@') ? 'email' : 'phone');
  const email = state?.email ?? (channel === 'email' ? state?.emailOrPhone : undefined);
  const phone = state?.phone ?? (channel === 'phone' ? state?.emailOrPhone : undefined);
  const target = email ?? phone ?? '';
  const { register, handleSubmit, formState: { errors }, setFocus } = useForm<z.infer<typeof verifySchema>>({ resolver: zodResolver(verifySchema) });

  useEffect(() => {
    if (!target) {
      toast.error('Missing email or phone. Start from login or signup.');
      navigate('/login');
      return;
    }
    setResendCooldown(60);
  }, [target, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setLoading(true);
    try {
      const res = await api.verifyOtp({
        channel,
        email: channel === 'email' ? target : undefined,
        phone: channel === 'phone' ? target : undefined,
        code: data.code,
      });
      if (res.user) { setUser(res.user); } else { const me = await api.me(); setUser(me); }
      toast.success('Signed in.');
      navigate('/account', { replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      await api.requestOtp({ channel, email: channel === 'email' ? target : undefined, phone: channel === 'phone' ? target : undefined });
      toast.success('Code sent again.');
      setResendCooldown(60);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  const maskedTarget = target.length <= 4 ? '****' : target.slice(0, 2) + '****' + target.slice(-2);

  return (
    <div className={p.verifyWrapper}>
      <Card className={p.verifyCard}>
        <Title2 className={p.verifyHeading}>Verify your account</Title2>
        <Text className={p.verifySubheading}>We sent a 6-digit code to {maskedTarget}</Text>
        <form onSubmit={handleSubmit(onSubmit)} className={p.verifyForm}>
          <div className={p.verifyInputGroup}>
            <label htmlFor="code" style={{ fontSize: 13, fontWeight: 500 }}>Verification code</label>
            <Input id="code" type="text" maxLength={6} placeholder="000000" autoComplete="one-time-code" {...register('code', { onBlur: () => setFocus('code') })} />
            {errors.code && <span role="alert" className={p.verifyError}>{errors.code.message}</span>}
          </div>
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

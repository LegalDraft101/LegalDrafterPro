import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Input,
  RadioGroup,
  Radio,
} from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { AuthLayout } from '../../components/common/Shared/Shared';
import { api } from '../../api/index';
import { emailSchema, passwordSchema } from '../../lib/validation';
import { useAuthFormStyles, INDIA_PREFIX } from './authStyles';

const requestSchema = z.object({
  channel: z.enum(['email', 'phone']),
  emailOrPhone: z.string().trim().min(1, 'Enter email or phone'),
}).refine((data) => {
  if (data.channel === 'email') return emailSchema.safeParse(data.emailOrPhone).success;
  return data.emailOrPhone.replace(/\D/g, '').length === 10;
}, { message: 'Enter 10-digit mobile number', path: ['emailOrPhone'] });

const resetSchema = z.object({
  code: z.string().length(6, 'Enter 6-digit code').regex(/^\d{6}$/, 'Digits only'),
  newPassword: z.string().min(1, 'Enter new password').refine((v) => passwordSchema.safeParse(v).success, 'Password must be 8+ characters with uppercase, lowercase and a number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [channel, setChannel] = useState<'email' | 'phone'>('email');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const s = useAuthFormStyles();
  const requestForm = useForm<z.infer<typeof requestSchema>>({ resolver: zodResolver(requestSchema), defaultValues: { channel: 'email', emailOrPhone: '' } });
  const resetForm = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema), defaultValues: { code: '', newPassword: '', confirmPassword: '' } });

  const onRequestSubmit = async (data: z.infer<typeof requestSchema>) => {
    setLoading(true);
    const start = Date.now();
    try {
      const ch = data.channel;
      const value = data.emailOrPhone.trim();
      await api.forgotPassword({ channel: ch, email: ch === 'email' ? value : undefined, phone: ch === 'phone' ? INDIA_PREFIX + value.replace(/\D/g, '').slice(0, 10) : undefined });
      setChannel(ch);
      setTarget(value);
      setStep('reset');
      toast.success('Code sent. Check your ' + (ch === 'email' ? 'email' : 'phone') + '. Valid for 3 minutes.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Request failed');
    } finally {
      setTimeout(() => setLoading(false), Math.max(0, 2000 - (Date.now() - start)));
    }
  };

  const onResetSubmit = async (data: z.infer<typeof resetSchema>) => {
    setLoading(true);
    const start = Date.now();
    try {
      await api.resetPassword({
        channel,
        email: channel === 'email' ? target : undefined,
        phone: channel === 'phone' ? INDIA_PREFIX + target.replace(/\D/g, '').slice(0, 10) : undefined,
        code: data.code,
        newPassword: data.newPassword,
      });
      toast.success('Password updated. You can now log in.');
      navigate('/login');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setTimeout(() => setLoading(false), Math.max(0, 2000 - (Date.now() - start)));
    }
  };

  if (step === 'reset') {
    const masked = target.length <= 4 ? '****' : target.slice(0, 2) + '****' + target.slice(-2);
    return (
      <AuthLayout title="Set new password" subtitle={`Enter the 6-digit code sent to ${masked} and your new password.`} backLink={{ label: 'Back to home', to: '/' }} signupPrompt={{ text: 'Remember it? ', linkText: 'Back to login', to: '/login' }}>
        <form onSubmit={resetForm.handleSubmit(onResetSubmit)} noValidate>
          <div className={s.inputGroup}>
            <label htmlFor="code" className={s.label}>Verification code</label>
            <Input id="code" type="text" maxLength={6} placeholder="000000" {...resetForm.register('code')} />
            {resetForm.formState.errors.code && <span className={s.fieldError} role="alert">{resetForm.formState.errors.code.message}</span>}
          </div>
          <div className={s.inputGroup}>
            <label htmlFor="newPassword" className={s.label}>New password</label>
            <Input
              id="newPassword"
              type={showNewPassword ? 'text' : 'password'}
              placeholder="New password"
              autoComplete="new-password"
              contentAfter={
                <Button appearance="transparent" size="small" icon={showNewPassword ? <EyeOffRegular /> : <EyeRegular />} onClick={() => setShowNewPassword((p) => !p)} aria-label={showNewPassword ? 'Hide password' : 'Show password'} />
              }
              {...resetForm.register('newPassword')}
            />
            {resetForm.formState.errors.newPassword && <span className={s.fieldError} role="alert">{resetForm.formState.errors.newPassword.message}</span>}
          </div>
          <div className={s.inputGroup}>
            <label htmlFor="confirmPassword" className={s.label}>Confirm password</label>
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm password"
              autoComplete="new-password"
              contentAfter={
                <Button appearance="transparent" size="small" icon={showConfirmPassword ? <EyeOffRegular /> : <EyeRegular />} onClick={() => setShowConfirmPassword((p) => !p)} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'} />
              }
              {...resetForm.register('confirmPassword')}
            />
            {resetForm.formState.errors.confirmPassword && <span className={s.fieldError} role="alert">{resetForm.formState.errors.confirmPassword.message}</span>}
          </div>
          <div className={s.submitRow}>
            <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>{loading ? 'Updating…' : 'Update password'}</Button>
          </div>
          <Button appearance="transparent" size="small" onClick={() => setStep('request')} style={{ marginTop: 4 }}>Use a different email or phone</Button>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password" subtitle="Choose how to receive your reset code. Valid for 3 minutes." backLink={{ label: 'Back to home', to: '/' }} signupPrompt={{ text: 'Remember it? ', linkText: 'Back to login', to: '/login' }}>
      <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} noValidate>
        <div className={s.inputGroup}>
          <label className={s.label}>Send code via</label>
          <RadioGroup
            layout="horizontal"
            value={requestForm.watch('channel')}
            onChange={(_e, data) => { requestForm.setValue('channel', data.value as 'email' | 'phone'); requestForm.setValue('emailOrPhone', ''); }}
            className={s.otpChannelRow}
          >
            <Radio value="email" label="Email" />
            <Radio value="phone" label="Phone" />
          </RadioGroup>
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="emailOrPhone" className={s.label}>{requestForm.watch('channel') === 'email' ? 'Email address' : 'Mobile number'}</label>
          {requestForm.watch('channel') === 'email' ? (
            <Input id="emailOrPhone" type="text" placeholder="Email address" autoComplete="email" {...requestForm.register('emailOrPhone')} />
          ) : (
            <div className={s.phoneRow}>
              <span className={s.phonePrefix} aria-hidden>+91</span>
              <Input id="emailOrPhone" type="tel" maxLength={10} placeholder="9876543210" autoComplete="tel-national" style={{ flex: 1 }} {...requestForm.register('emailOrPhone', { setValueAs: (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : '') })} />
            </div>
          )}
          {requestForm.formState.errors.emailOrPhone && <span className={s.fieldError} role="alert">{requestForm.formState.errors.emailOrPhone.message}</span>}
        </div>
        <div className={s.submitRow}>
          <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>{loading ? 'Sending…' : 'Send reset code'}</Button>
        </div>
      </form>
    </AuthLayout>
  );
}

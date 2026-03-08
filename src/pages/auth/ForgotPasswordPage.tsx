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
import { AuthLayout } from '../../components/common/Shared/Shared';
import { emailSchema } from '../../lib/validation';
import { useAuthFormStyles } from './authStyles';
import { auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const requestSchema = z.object({
  channel: z.enum(['email', 'phone']),
  emailOrPhone: z.string().trim().min(1, 'Enter email or phone'),
}).refine((data) => {
  if (data.channel === 'email') return emailSchema.safeParse(data.emailOrPhone).success;
  return data.emailOrPhone.replace(/\D/g, '').length === 10;
}, { message: 'Enter 10-digit mobile number', path: ['emailOrPhone'] });

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const s = useAuthFormStyles();
  const requestForm = useForm<z.infer<typeof requestSchema>>({ resolver: zodResolver(requestSchema), defaultValues: { channel: 'email', emailOrPhone: '' } });

  const onRequestSubmit = async (data: z.infer<typeof requestSchema>) => {
    if (data.channel === 'phone') {
      toast.info('For phone numbers, simply use the OTP login from the Login page.');
      navigate('/login');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.emailOrPhone.trim());
      toast.success('Password reset email sent! Check your inbox.');
      navigate('/login');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send reset email. Ensure the email is registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password" subtitle="Generate a password reset email to recover your account." backLink={{ label: 'Back to home', to: '/' }} signupPrompt={{ text: 'Remember it? ', linkText: 'Back to login', to: '/login' }}>
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

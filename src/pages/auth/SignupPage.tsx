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
import { api, type SignupOtpChannel } from '../../api/index';
import { emailSchema, passwordSchema } from '../../lib/validation';
import { useAuthFormStyles, INDIA_PREFIX } from './authStyles';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name 2–50 characters').max(50, 'Name 2–50 characters'),
  email: emailSchema,
  phone: z.string().trim().transform((s) => s.replace(/\D/g, '')).refine((s) => s.length === 10, 'Enter 10-digit mobile number'),
  password: z.string().min(1, 'Enter a password').refine((v) => passwordSchema.safeParse(v).success, 'Password must be 8+ characters with uppercase, lowercase and a number'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] });
});

export function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [otpChannel, setOtpChannel] = useState<SignupOtpChannel>('email');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const s = useAuthFormStyles();
  const { register, handleSubmit, clearErrors, setError, formState: { errors } } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  });

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    const start = Date.now();
    try {
      await api.signup({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: INDIA_PREFIX + data.phone.replace(/\D/g, '').slice(0, 10),
        password: data.password,
        otpChannel,
      });
      toast.success(otpChannel === 'phone' ? 'Verification code sent to your phone.' : 'Verification code sent to your email.');
      navigate('/verify', {
        state: {
          channel: otpChannel === 'phone' ? ('phone' as const) : ('email' as const),
          email: data.email.trim().toLowerCase(),
          phone: INDIA_PREFIX + data.phone.replace(/\D/g, '').slice(0, 10),
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed';
      toast.error(msg.toLowerCase().includes('invalid input') ? 'Invalid email' : msg);
    } finally {
      setTimeout(() => setLoading(false), Math.max(0, 2000 - (Date.now() - start)));
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Enter your details to sign up" backLink={{ label: 'Back to home', to: '/' }} signupPrompt={{ text: 'Already have an account? ', linkText: 'Login', to: '/login' }}>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} noValidate>
        <div className={s.inputGroup}>
          <label htmlFor="name" className={s.label}>Name</label>
          <Input id="name" type="text" placeholder="Name" autoComplete="name" {...register('name')} />
          {errors.name && <span className={s.fieldError} role="alert">{errors.name.message}</span>}
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="email" className={s.label}>Email address</label>
          <Input id="email" type="text" placeholder="Email address" autoComplete="email" {...register('email', { onChange: () => clearErrors('email') })} />
          {errors.email && (
            <div className={s.errorBox} role="alert">
              <span className={s.errorIcon} aria-hidden>!</span>
              <span>{(errors.email.message || '').replace(/invalid input/i, 'Invalid email')}</span>
            </div>
          )}
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="phone" className={s.label}>Phone number</label>
          <div className={s.phoneRow}>
            <span className={s.phonePrefix} aria-hidden>+91</span>
            <Input id="phone" type="tel" maxLength={10} placeholder="9876543210" autoComplete="tel-national" style={{ flex: 1 }} {...register('phone', { setValueAs: (v) => (typeof v === 'string' ? v.replace(/\D/g, '') : '') })} />
          </div>
          {errors.phone && <span className={s.fieldError} role="alert">{errors.phone.message}</span>}
        </div>
        <div className={errors.confirmPassword?.message === 'Passwords do not match' ? s.passwordFieldsError : ''}>
          <div className={s.inputGroup}>
            <label htmlFor="password" className={s.label}>Password</label>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="new-password"
              contentAfter={
                <Button appearance="transparent" size="small" icon={showPassword ? <EyeOffRegular /> : <EyeRegular />} onClick={() => setShowPassword((p) => !p)} aria-label={showPassword ? 'Hide password' : 'Show password'} />
              }
              {...register('password', { onChange: () => clearErrors('password') })}
            />
            {errors.password && <span className={s.fieldError} role="alert">{errors.password.message}</span>}
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
              {...register('confirmPassword', { onChange: () => clearErrors('confirmPassword') })}
            />
            {errors.confirmPassword?.message === 'Passwords do not match' ? (
              <div className={s.errorBox} role="alert">
                <span className={s.errorIcon} aria-hidden>!</span>
                <span>Both passwords are not the same.</span>
              </div>
            ) : errors.confirmPassword ? <span className={s.fieldError} role="alert">{errors.confirmPassword.message}</span> : null}
          </div>
        </div>
        <div className={s.inputGroup}>
          <label className={s.label}>Send verification code to</label>
          <RadioGroup
            layout="horizontal"
            value={otpChannel}
            onChange={(_e, data) => setOtpChannel(data.value as SignupOtpChannel)}
            className={s.otpChannelRow}
          >
            <Radio value="email" label="Email" />
            <Radio value="phone" label="Phone" />
          </RadioGroup>
        </div>
        <div className={s.submitRow}>
          <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending…' : 'Send OTP'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

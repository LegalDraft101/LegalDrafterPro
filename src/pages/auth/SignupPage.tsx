import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Input,
} from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { AuthLayout } from '../../components/common/Shared/Shared';
import { auth } from '../../lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { api } from '../../api/index';
import { emailSchema, passwordSchema } from '../../lib/validation';
import { useAuthFormStyles, INDIA_PREFIX } from './authStyles';
import { useAuth } from '../../hooks/useAuth';

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
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
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
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);

      // Update Firebase display name
      try {
        await updateProfile(userCredential.user, { displayName: data.name.trim() });
      } catch (e) {
        console.warn('Failed to update Firebase profile:', e);
      }

      // Force a token refresh so the backend gets a fresh token immediately
      await userCredential.user.getIdToken(true);

      // Send Firebase email verification — user must verify before logging in
      try {
        await sendEmailVerification(userCredential.user);
      } catch (e) {
        console.warn('Failed to send verification email:', e);
      }

      // Sync additional profile fields (phone, name) to our backend — non-fatal
      try {
        const res = await api.signup({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          phone: INDIA_PREFIX + data.phone.replace(/\D/g, '').slice(0, 10),
        });
        if (res.user) {
          setUser(res.user);
        }
      } catch (syncErr) {
        // Backend sync is best-effort — Firebase account was created successfully
        console.warn('Backend profile sync failed (non-fatal):', syncErr);
      }

      toast.success('Account created! Please verify your email before logging in.');
      navigate('/verify-email');
    } catch (e: any) {
      // Map Firebase error codes to friendly messages
      const code: string = e?.code ?? '';
      const msg: string = e?.message ?? 'Signup failed';
      let displayMsg = msg;

      if (code === 'auth/email-already-in-use' || msg.includes('email-already-in-use')) {
        displayMsg = 'This email is already registered. Please login instead.';
      } else if (code === 'auth/weak-password' || msg.includes('weak-password')) {
        displayMsg = 'Password is too weak. Use 8+ characters with upper, lower and a number.';
      } else if (code === 'auth/invalid-email' || msg.includes('invalid-email')) {
        displayMsg = 'Invalid email address.';
      } else if (code === 'auth/too-many-requests' || msg.includes('too-many-requests')) {
        displayMsg = 'Too many attempts. Please try again later.';
      } else if (code === 'auth/network-request-failed' || msg.includes('network')) {
        displayMsg = 'Network error. Check your connection and try again.';
      } else if (code === 'auth/popup-closed-by-user' || msg.includes('popup')) {
        displayMsg = 'Sign-in was interrupted. Please try again.';
      } else if (code === 'auth/cancelled-popup-request') {
        displayMsg = 'Another sign-in is already in progress.';
      } else if (code.startsWith('auth/')) {
        displayMsg = `Sign-up error: ${code.replace('auth/', '').replace(/-/g, ' ')}.`;
      }

      toast.error(displayMsg);
    } finally {
      setLoading(false);
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

        <div className={s.submitRow}>
          <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Creating Account…' : 'Sign Up'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

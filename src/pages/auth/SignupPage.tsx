import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Text,
  tokens,
  Spinner,
} from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular, CheckmarkCircle24Filled, MailRegular, PhoneRegular } from '@fluentui/react-icons';
import { AuthLayout } from '../../components/common/Shared/Shared';
import { auth } from '../../lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  deleteUser,
} from 'firebase/auth';
import { api } from '../../api/index';
import { emailSchema, passwordSchema } from '../../lib/validation';
import { useAuthFormStyles, INDIA_PREFIX } from './authStyles';
import { useAuth } from '../../hooks/useAuth';
import { fetchUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name 2–50 characters').max(50, 'Name 2–50 characters'),
  email: emailSchema,
  phone: z.string().trim().transform((s) => s.replace(/\D/g, '')).refine((s) => s.length === 10, 'Enter 10-digit mobile number'),
  password: z.string().min(1, 'Enter a password').refine((v) => passwordSchema.safeParse(v).success, 'Password must be 8+ characters with uppercase, lowercase and a number'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] });
});

const otpSchema = z.object({
  code: z.string().length(6, 'Enter 6-digit code').regex(/^\d{6}$/, 'Digits only'),
});

type SignupStep = 'form' | 'verify-email' | 'verify-phone';

export function SignupPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<SignupStep>('form');
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailResendCooldown, setEmailResendCooldown] = useState(0);
  const [phoneResendCooldown, setPhoneResendCooldown] = useState(0);
  const [pendingData, setPendingData] = useState<{ name: string; email: string; phone: string } | null>(null);
  const signupFinalizedRef = useRef(false);
  const s = useAuthFormStyles();

  const { register, handleSubmit, clearErrors, setError, formState: { errors } } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    mode: 'onTouched',
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  });

  const deleteUnverifiedUser = useCallback(async () => {
    if (signupFinalizedRef.current) return;
    const user = auth.currentUser;
    if (user) {
      try { await deleteUser(user); } catch {}
    }
  }, []);

  // Warn user on tab close during verification
  useEffect(() => {
    if (step === 'form') return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!signupFinalizedRef.current) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [step]);

  // Clean up Firebase user on unmount if signup wasn't finalized
  useEffect(() => {
    return () => {
      if (step !== 'form' && !signupFinalizedRef.current) {
        deleteUnverifiedUser();
      }
    };
  }, [step, deleteUnverifiedUser]);

  // Step 1: Poll for email verification
  useEffect(() => {
    if (step !== 'verify-email' || emailVerified) return;
    const interval = setInterval(async () => {
      if (!auth.currentUser) return;
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setEmailVerified(true);
        toast.success('Email verified!');
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [step, emailVerified]);

  // Auto-transition: email verified → send phone OTP → verify-phone step
  useEffect(() => {
    if (step !== 'verify-email' || !emailVerified || !pendingData || !auth.currentUser) return;
    (async () => {
      setLoading(true);
      try {
        if ((window as any).signupRecaptchaVerifier) {
          try { (window as any).signupRecaptchaVerifier.clear(); } catch {}
          (window as any).signupRecaptchaVerifier = undefined;
        }
        (window as any).signupRecaptchaVerifier = new RecaptchaVerifier(auth, 'signup-recaptcha', { size: 'invisible' });
        await auth.currentUser!.getIdToken(true);
        const confirmationResult = await linkWithPhoneNumber(auth.currentUser!, pendingData.phone, (window as any).signupRecaptchaVerifier);
        (window as any).confirmationResult = confirmationResult;
        setStep('verify-phone');
        setPhoneResendCooldown(60);
        toast.success('OTP sent to your phone!');
      } catch (e: any) {
        toast.error(e.message || 'Failed to send phone OTP. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [step, emailVerified, pendingData]);

  // Finalize signup when phone is verified
  useEffect(() => {
    if (!phoneVerified || !emailVerified || !pendingData || !auth.currentUser) return;
    (async () => {
      setLoading(true);
      try {
        const res = await api.signup({
          name: pendingData.name,
          email: pendingData.email,
          phone: pendingData.phone,
        });
        signupFinalizedRef.current = true;
        if (res.user) setUser(res.user);
        await dispatch(fetchUser());
        toast.success('Account created and verified successfully!');
        const from = (location.state as any)?.from || '/';
        navigate(from);
      } catch (e: any) {
        toast.error(e.message || 'Failed to create account.');
      } finally {
        setLoading(false);
      }
    })();
  }, [phoneVerified, emailVerified, pendingData]);

  // Cooldown timers
  useEffect(() => {
    if (emailResendCooldown <= 0) return;
    const t = setInterval(() => setEmailResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [emailResendCooldown]);

  useEffect(() => {
    if (phoneResendCooldown <= 0) return;
    const t = setInterval(() => setPhoneResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [phoneResendCooldown]);

  // ---------- Handlers ----------

  const onSubmit = async (data: z.infer<typeof signupSchema>) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', { type: 'manual', message: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    try {
      const emailVal = data.email.trim().toLowerCase();
      const phoneVal = INDIA_PREFIX + data.phone.replace(/\D/g, '').slice(0, 10);

      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, emailVal, data.password);
        try { await updateProfile(userCredential.user, { displayName: data.name.trim() }); } catch {}
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          try {
            userCredential = await signInWithEmailAndPassword(auth, emailVal, data.password);
          } catch (loginErr: any) {
            if (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential') {
              throw new Error('This email is already registered with a different password. Please login instead.');
            }
            throw loginErr;
          }
        } else {
          throw fbErr;
        }
      }

      // Send email verification link
      if (auth.currentUser && !auth.currentUser.emailVerified) {
        await sendEmailVerification(auth.currentUser);
      }

      setPendingData({ name: data.name.trim(), email: emailVal, phone: phoneVal });

      if (auth.currentUser?.emailVerified) {
        setEmailVerified(true);
      }
      setStep('verify-email');
      setEmailResendCooldown(60);
      toast.info('Verification link sent to your email.');
    } catch (e: any) {
      const code: string = e?.code ?? '';
      let displayMsg = e?.message ?? 'Signup failed';
      if (code === 'auth/email-already-in-use') displayMsg = 'This email is already registered. Please login instead.';
      else if (code === 'auth/weak-password') displayMsg = 'Password is too weak. Use 8+ characters with upper, lower and a number.';
      else if (code === 'auth/invalid-email') displayMsg = 'Invalid email address.';
      else if (code === 'auth/too-many-requests') displayMsg = 'Too many attempts. Please try again later.';
      else if (code === 'auth/network-request-failed') displayMsg = 'Network error. Check your connection and try again.';
      toast.error(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const onResendEmail = async () => {
    if (emailResendCooldown > 0 || !auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailResendCooldown(60);
      toast.success('Verification email resent!');
    } catch (e: any) {
      toast.error(e.message || 'Could not resend email.');
    }
  };

  const onVerifyPhone = async (data: z.infer<typeof otpSchema>) => {
    setLoading(true);
    try {
      const cr = (window as any).confirmationResult;
      if (!cr) throw new Error('No active verification session.');
      if (auth.currentUser) await auth.currentUser.getIdToken(true);

      try {
        await cr.confirm(data.code);
      } catch (confirmErr: any) {
        if (confirmErr?.code === 'auth/invalid-verification-code' || confirmErr?.code === 'auth/code-expired') {
          throw confirmErr;
        }
        // The phone link may have succeeded but the internal reload failed (400 on accounts:lookup).
        // Check if the phone provider is now attached.
        if (auth.currentUser) {
          await auth.currentUser.reload();
          const hasPhone = auth.currentUser.providerData.some((p: any) => p.providerId === 'phone');
          if (!hasPhone) throw confirmErr;
        } else {
          throw confirmErr;
        }
      }

      setPhoneVerified(true);
      toast.success('Phone verified!');
    } catch (e: any) {
      otpForm.reset();
      const msg = e?.code === 'auth/invalid-verification-code'
        ? 'Invalid code. Please try again.'
        : e?.code === 'auth/code-expired'
          ? 'Code expired. Please resend.'
          : (e.message || 'Verification failed. Please try again.');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResendPhone = async () => {
    if (phoneResendCooldown > 0 || !pendingData || !auth.currentUser) return;
    setLoading(true);
    try {
      if ((window as any).signupRecaptchaVerifier) {
        try { (window as any).signupRecaptchaVerifier.clear(); } catch {}
        (window as any).signupRecaptchaVerifier = undefined;
      }
      (window as any).signupRecaptchaVerifier = new RecaptchaVerifier(auth, 'signup-recaptcha', { size: 'invisible' });
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, pendingData.phone, (window as any).signupRecaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;
      otpForm.reset();
      setPhoneResendCooldown(60);
      toast.success('New OTP sent! Please enter the new code.');
    } catch (e: any) {
      toast.error(e.message || 'Resend failed');
      if ((window as any).signupRecaptchaVerifier) {
        try { (window as any).signupRecaptchaVerifier.clear(); } catch {}
        (window as any).signupRecaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const onCancelSignup = async () => {
    await deleteUnverifiedUser();
    setPendingData(null);
    setStep('form');
    setEmailVerified(false);
    setPhoneVerified(false);
    toast.info('Signup cancelled. You can start over.');
  };

  // ---------- Step: Verify Email ----------
  if (step === 'verify-email') {
    return (
      <AuthLayout
        title="Verify your email"
        subtitle="Step 1 of 2"
        backLink={{ label: 'Back to home', to: '/' }}
        signupPrompt={{ text: 'Already have an account? ', linkText: 'Login', to: '/login' }}
      >
        <div id="signup-recaptcha"></div>
        <div style={{ marginBottom: '16px', backgroundColor: tokens.colorBrandBackground2, padding: '16px', borderRadius: '8px' }}>
          <Text style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Verification Progress</Text>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', listStyle: 'none' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: emailVerified ? tokens.colorPaletteGreenForeground1 : tokens.colorBrandForeground1, fontWeight: 600 }}>
              {emailVerified ? <CheckmarkCircle24Filled /> : <MailRegular />}
              {emailVerified ? 'Email Verified' : 'Verify Email (current)'}
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: tokens.colorNeutralForeground4 }}>
              <PhoneRegular />
              Verify Phone (next)
            </li>
          </ul>
        </div>

        {!emailVerified ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            <MailRegular style={{ fontSize: '48px', color: tokens.colorBrandForeground1 }} />
            <Text style={{ display: 'block', textAlign: 'center', fontWeight: 500 }}>
              We sent a verification link to
            </Text>
            <Text style={{ display: 'block', textAlign: 'center', fontWeight: 600, color: tokens.colorBrandForeground1 }}>
              {pendingData?.email}
            </Text>
            <Text style={{ display: 'block', textAlign: 'center', fontSize: '13px', color: tokens.colorNeutralForeground3 }}>
              Click the link in your email to verify. This page will update automatically.
            </Text>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size="tiny" />
              <Text style={{ fontSize: '13px', color: tokens.colorNeutralForeground3 }}>Waiting for verification...</Text>
            </div>
            <Button
              appearance="secondary"
              onClick={onResendEmail}
              disabled={emailResendCooldown > 0}
              style={{ width: '100%', maxWidth: '300px' }}
            >
              {emailResendCooldown > 0 ? `Resend email in ${emailResendCooldown}s` : 'Resend Verification Email'}
            </Button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
            <CheckmarkCircle24Filled style={{ fontSize: '48px', color: tokens.colorPaletteGreenForeground1 }} />
            <Text style={{ fontWeight: 600 }}>Email verified! Sending phone OTP...</Text>
            <Spinner size="small" />
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onCancelSignup}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem', textDecoration: 'underline' }}
          >
            Cancel and start over
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ---------- Step: Verify Phone ----------
  if (step === 'verify-phone') {
    const maskedPhone = pendingData?.phone
      ? pendingData.phone.slice(0, 4) + '****' + pendingData.phone.slice(-2)
      : '****';

    return (
      <AuthLayout
        title="Verify your phone"
        subtitle="Step 2 of 2"
        backLink={{ label: 'Back to home', to: '/' }}
        signupPrompt={{ text: 'Already have an account? ', linkText: 'Login', to: '/login' }}
      >
        <div id="signup-recaptcha"></div>
        <div style={{ marginBottom: '16px', backgroundColor: tokens.colorBrandBackground2, padding: '16px', borderRadius: '8px' }}>
          <Text style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Verification Progress</Text>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', listStyle: 'none' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', color: tokens.colorPaletteGreenForeground1 }}>
              <CheckmarkCircle24Filled />
              Email Verified
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', color: phoneVerified ? tokens.colorPaletteGreenForeground1 : tokens.colorBrandForeground1, fontWeight: phoneVerified ? 400 : 600 }}>
              {phoneVerified ? <CheckmarkCircle24Filled /> : <PhoneRegular />}
              {phoneVerified ? 'Phone Verified' : 'Verify Phone (current)'}
            </li>
          </ul>
        </div>

        {!phoneVerified ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <PhoneRegular style={{ fontSize: '24px', color: tokens.colorBrandForeground1 }} />
              <Text style={{ fontSize: '13px' }}>
                We sent a 6-digit code to <strong>{maskedPhone}</strong>
              </Text>
            </div>
            <form onSubmit={otpForm.handleSubmit(onVerifyPhone)} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className={s.inputGroup}>
                <label htmlFor="otp-code" className={s.label}>Verification code</label>
                <Input id="otp-code" type="text" maxLength={6} placeholder="000000" autoComplete="one-time-code" {...otpForm.register('code')} />
                {otpForm.formState.errors.code && <span className={s.fieldError}>{otpForm.formState.errors.code.message}</span>}
              </div>
              <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Verifying...' : 'Verify Phone'}
              </Button>
              <Button
                appearance="secondary"
                onClick={onResendPhone}
                disabled={phoneResendCooldown > 0 || loading}
                style={{ width: '100%' }}
              >
                {phoneResendCooldown > 0 ? `Resend OTP in ${phoneResendCooldown}s` : 'Resend Phone OTP'}
              </Button>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '12px 0' }}>
            <CheckmarkCircle24Filled style={{ fontSize: '48px', color: tokens.colorPaletteGreenForeground1 }} />
            <Text style={{ fontWeight: 600 }}>All verified! Creating your account...</Text>
            <Spinner size="small" />
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button
            type="button"
            onClick={onCancelSignup}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.875rem', textDecoration: 'underline' }}
          >
            Cancel and start over
          </button>
        </div>
      </AuthLayout>
    );
  }

  // ---------- Step: Form ----------
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
            {loading ? 'Processing...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  Button,
  Input,
  Text,
  Divider,
  Spinner,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Dismiss24Regular, EyeRegular, EyeOffRegular, CheckmarkCircle24Filled, MailRegular, PhoneRegular } from '@fluentui/react-icons';
import { useAuthModal } from './AuthModalContext';
import { api } from '../../../api/index';
import { auth } from '../../../lib/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  deleteUser,
} from 'firebase/auth';
import { emailSchema, passwordSchema, isEmailTechnicallyCorrect } from '../../../lib/validation';
import { GoogleIcon } from '../../common/Shared/Shared';
import { fetchUser } from '../../../store/slices/authSlice';
import { useAppDispatch } from '../../../store/hooks';
import { useAuth } from '../../../hooks/useAuth';

const INDIA_PREFIX = '+91';

type ModalView = 'login' | 'signup' | 'verify-login-otp' | 'verify-email' | 'verify-phone';

interface PendingSignup {
  name: string;
  email: string;
  phone: string;
}

// ---- Zod schemas ----

const loginSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Add a valid email address').refine(
    (val) => {
      const v = val.replace(/\s/g, '');
      if (v.includes('@') || (!v.startsWith('+') && !/^\d/.test(v))) return emailSchema.safeParse(val).success;
      if (/^\+[1-9]\d{1,14}$/.test(v)) return true;
      if (/^\d{10}$/.test(v)) return true;
      return false;
    },
    'Add a valid email address'
  ),
  password: z.string().refine(
    (val) => !val || passwordSchema.safeParse(val).success,
    'Password must have uppercase, lowercase and a number'
  ),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Name 2\u201350 characters').max(50, 'Name 2\u201350 characters'),
  email: emailSchema,
  phone: z.string().trim().transform((s) => s.replace(/\D/g, '')).refine((s) => s.length === 10, 'Enter 10-digit mobile number'),
  password: z.string().min(1, 'Enter a password').refine((v) => passwordSchema.safeParse(v).success, 'Password must be 8+ characters with uppercase, lowercase and a number'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword)
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Passwords do not match', path: ['confirmPassword'] });
});

const otpSchema = z.object({
  code: z.string().length(6, 'Enter 6-digit code').regex(/^\d{6}$/, 'Digits only'),
});

// ---- Styles ----

const useStyles = makeStyles({
  surface: {
    width: '100%',
    maxWidth: '460px',
    maxHeight: '90vh',
    borderRadius: '16px',
    padding: '0',
  },
  body: {
    padding: '28px 32px 24px',
    overflowY: 'auto',
    '@media (max-width: 480px)': {
      padding: '20px 16px 16px',
    },
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '0',
    marginBottom: '4px',
  },
  subtitle: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    marginBottom: '20px',
    display: 'block',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  fieldError: {
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: tokens.colorPaletteRedBackground1,
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
  },
  errorIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteRedForeground1,
    color: '#fff',
    fontWeight: 700,
    fontSize: '11px',
    flexShrink: 0,
  },
  submitRow: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  switchRow: {
    fontSize: '13px',
    textAlign: 'center' as const,
    marginTop: '16px',
    color: tokens.colorNeutralForeground3,
  },
  link: {
    background: 'none',
    border: 'none',
    padding: 0,
    color: tokens.colorBrandForegroundLink,
    fontWeight: 600,
    fontSize: '13px',
    cursor: 'pointer',
    textDecoration: 'none',
    ':hover': { textDecoration: 'underline' },
  },
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  socialRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  phoneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  phonePrefix: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    padding: '0 4px',
  },
  passwordFieldsError: {
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    borderRadius: '8px',
    padding: '12px',
  },
  verifyCenter: {
    textAlign: 'center' as const,
  },
  verifyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left' as const,
  },
});

// ---- LoginView ----

function LoginView({
  onSwitchToSignup,
  onLoginSuccess,
  onPhoneOtp,
  styles: s,
}: {
  onSwitchToSignup: () => void;
  onLoginSuccess: () => void;
  onPhoneOtp: (phone: string) => void;
  styles: ReturnType<typeof useStyles>;
}) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const dispatch = useAppDispatch();
  const { register, handleSubmit, clearErrors, watch, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });
  const passwordValue = watch('password', '');
  void isEmailTechnicallyCorrect;

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const trimmed = data.emailOrPhone.trim();
      const isEmail = trimmed.includes('@');

      if (isEmail) {
        if (!data.password) {
          toast.error('Password is required for email login.');
          setLoading(false);
          return;
        }
        await signInWithEmailAndPassword(auth, trimmed.toLowerCase(), data.password);
        setTimeout(async () => {
          await dispatch(fetchUser());
          toast.success('Logged in successfully!');
          onLoginSuccess();
        }, 500);
      } else {
        const normalized = trimmed.replace(/\D/g, '').length === 10 ? '+91' + trimmed.replace(/\D/g, '') : trimmed;

        if ((window as any).modalRecaptchaVerifier) {
          try { (window as any).modalRecaptchaVerifier.clear(); } catch {}
          (window as any).modalRecaptchaVerifier = undefined;
        }
        (window as any).modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modal-recaptcha', { size: 'invisible' });
        const confirmationResult = await signInWithPhoneNumber(auth, normalized, (window as any).modalRecaptchaVerifier);
        (window as any).confirmationResult = confirmationResult;

        toast.success('OTP sent to your phone.');
        onPhoneOtp(normalized);
      }
    } catch (e: any) {
      toast.error(e.message || 'Login failed');
      if ((window as any).modalRecaptchaVerifier) {
        (window as any).modalRecaptchaVerifier.clear();
        (window as any).modalRecaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      try { await api.googleCreate(); } catch {}
      await dispatch(fetchUser());
      toast.success('Logged in with Google!');
      onLoginSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit, () => toast.error('Please fix the errors below.'))(e); }} noValidate>
        <div className={s.inputGroup}>
          <label htmlFor="modal-emailOrPhone" className={s.label}>Email address</label>
          <Input
            id="modal-emailOrPhone"
            type="text"
            placeholder="Email address"
            autoComplete="email"
            {...register('emailOrPhone', { onChange: () => clearErrors('emailOrPhone') })}
          />
          {errors.emailOrPhone && (
            <div className={s.errorBox} role="alert">
              <span className={s.errorIcon} aria-hidden>!</span>
              <span>{(errors.emailOrPhone.message || '').replace(/invalid input/i, 'Invalid email')}</span>
            </div>
          )}
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="modal-password" className={s.label}>Password</label>
          <Input
            id="modal-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            contentAfter={
              <Button
                appearance="transparent"
                size="small"
                icon={showPassword ? <EyeOffRegular /> : <EyeRegular />}
                onClick={() => setShowPassword((p) => !p)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              />
            }
            {...register('password', { onChange: () => clearErrors('password') })}
          />
          {errors.password && (
            <div className={s.errorBox} role="alert">
              <span className={s.errorIcon} aria-hidden>!</span>
              <span>
                {String(passwordValue ?? '').trim().length < 8 ? 'Minimum 8 characters' : 'Password must have uppercase, lowercase and a number'}
              </span>
            </div>
          )}
        </div>
        <div className={s.submitRow}>
          <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending\u2026' : 'Login'}
          </Button>
        </div>
      </form>
      <Divider style={{ margin: '12px 0' }}>Or</Divider>
      <div className={s.socialRow}>
        <Button appearance="outline" icon={<GoogleIcon size={18} />} onClick={handleGoogle} aria-label="Login with Google">
          Google
        </Button>
      </div>
      <div className={s.switchRow}>
        Don&apos;t have an account?{' '}
        <button type="button" className={s.link} onClick={onSwitchToSignup}>Sign up</button>
      </div>
    </>
  );
}

// ---- SignupView ----

function SignupView({
  onSwitchToLogin,
  onEmailVerify,
  styles: s,
}: {
  onSwitchToLogin: () => void;
  onEmailVerify: (data: PendingSignup) => void;
  styles: ReturnType<typeof useStyles>;
}) {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

      const pending: PendingSignup = { name: data.name.trim(), email: emailVal, phone: phoneVal };
      (window as any).pendingSignupData = pending;

      toast.info('Verification link sent to your email.');
      onEmailVerify(pending);
    } catch (e: any) {
      toast.error(e.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} noValidate>
        <div className={s.inputGroup}>
          <Text style={{ fontSize: '11px', color: tokens.colorNeutralForeground3, marginBottom: '8px', padding: '6px', backgroundColor: tokens.colorNeutralBackground3, borderRadius: '4px' }}>
            <strong>Why do we validate both email and phone?</strong> Due to strict legal documentation requirements, we require both a verified email and phone number before creating your account.
          </Text>
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="modal-name" className={s.label}>Name</label>
          <Input id="modal-name" type="text" placeholder="Name" autoComplete="name" {...register('name')} />
          {errors.name && <span className={s.fieldError} role="alert">{errors.name.message}</span>}
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="modal-email" className={s.label}>Email address</label>
          <Input id="modal-email" type="text" placeholder="Email address" autoComplete="email" {...register('email', { onChange: () => clearErrors('email') })} />
          {errors.email && (
            <div className={s.errorBox} role="alert">
              <span className={s.errorIcon} aria-hidden>!</span>
              <span>{(errors.email.message || '').replace(/invalid input/i, 'Invalid email')}</span>
            </div>
          )}
        </div>
        <div className={s.inputGroup}>
          <label htmlFor="modal-phone" className={s.label}>Phone number</label>
          <div className={s.phoneRow}>
            <span className={s.phonePrefix} aria-hidden>+91</span>
            <Input id="modal-phone" type="tel" maxLength={10} placeholder="9876543210" autoComplete="tel-national" style={{ flex: 1 }} {...register('phone', { setValueAs: (v: string) => (typeof v === 'string' ? v.replace(/\D/g, '') : '') })} />
          </div>
          {errors.phone && <span className={s.fieldError} role="alert">{errors.phone.message}</span>}
        </div>
        <div className={errors.confirmPassword?.message === 'Passwords do not match' ? s.passwordFieldsError : ''}>
          <div className={s.inputGroup}>
            <label htmlFor="modal-signupPassword" className={s.label}>Password</label>
            <Input
              id="modal-signupPassword"
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
            <label htmlFor="modal-confirmPassword" className={s.label}>Confirm password</label>
            <Input
              id="modal-confirmPassword"
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
      <div className={s.switchRow}>
        Already have an account?{' '}
        <button type="button" className={s.link} onClick={onSwitchToLogin}>Login</button>
      </div>
    </>
  );
}

// ---- VerifyEmailView (signup step 1) ----

function VerifyEmailView({
  pendingData,
  onEmailVerified,
  onCancel,
  styles: s,
}: {
  pendingData: PendingSignup;
  onEmailVerified: () => void;
  onCancel: () => void;
  styles: ReturnType<typeof useStyles>;
}) {
  const [resendCooldown, setResendCooldown] = useState(60);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (verified) return;
    const interval = setInterval(async () => {
      if (!auth.currentUser) return;
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        setVerified(true);
        toast.success('Email verified!');
        onEmailVerified();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [verified, onEmailVerified]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const onResend = async () => {
    if (resendCooldown > 0 || !auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(60);
      toast.success('Verification email resent!');
    } catch (e: any) {
      toast.error(e.message || 'Could not resend email.');
    }
  };

  return (
    <div className={s.verifyCenter}>
      <div style={{ marginBottom: '16px', textAlign: 'left', backgroundColor: tokens.colorBrandBackground2, padding: '12px', borderRadius: '8px' }}>
        <Text style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Step 1 of 2</Text>
        <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', listStyle: 'none' }}>
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px', color: verified ? tokens.colorPaletteGreenForeground1 : tokens.colorBrandForeground1, fontWeight: 600 }}>
            {verified ? <CheckmarkCircle24Filled /> : <MailRegular />}
            {verified ? 'Email Verified' : 'Verify Email (current)'}
          </li>
          <li style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: tokens.colorNeutralForeground4 }}>
            <PhoneRegular />
            Verify Phone (next)
          </li>
        </ul>
      </div>

      {!verified ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '8px 0' }}>
          <MailRegular style={{ fontSize: '40px', color: tokens.colorBrandForeground1 }} />
          <Text style={{ display: 'block', fontWeight: 500 }}>Check your inbox</Text>
          <Text style={{ display: 'block', fontWeight: 600, color: tokens.colorBrandForeground1, fontSize: '13px' }}>
            {pendingData.email}
          </Text>
          <Text style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>
            Click the link in your email to continue.
          </Text>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Spinner size="tiny" />
            <Text style={{ fontSize: '12px', color: tokens.colorNeutralForeground3 }}>Waiting...</Text>
          </div>
          <Button appearance="secondary" onClick={onResend} disabled={resendCooldown > 0} style={{ width: '100%' }}>
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'}
          </Button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
          <CheckmarkCircle24Filled style={{ fontSize: '40px', color: tokens.colorPaletteGreenForeground1 }} />
          <Text style={{ fontWeight: 600 }}>Sending phone OTP...</Text>
          <Spinner size="small" />
        </div>
      )}

      <div className={s.switchRow}>
        <button type="button" className={s.link} onClick={onCancel}>Cancel and start over</button>
      </div>
    </div>
  );
}

// ---- VerifyPhoneView (signup step 2 OR login phone OTP) ----

function VerifyPhoneView({
  phone,
  isSignup,
  onSuccess,
  onBack,
  styles: s,
}: {
  phone: string;
  isSignup: boolean;
  onSuccess: () => void;
  onBack: () => void;
  styles: ReturnType<typeof useStyles>;
}) {
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const { setUser } = useAuth();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  });

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const onSubmit = async (data: z.infer<typeof otpSchema>) => {
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
        if (auth.currentUser) {
          await auth.currentUser.reload();
          const hasPhone = auth.currentUser.providerData.some((p: any) => p.providerId === 'phone');
          if (!hasPhone) throw confirmErr;
        } else {
          throw confirmErr;
        }
      }

      toast.success('Phone verified!');

      if (isSignup) {
        const pending = (window as any).pendingSignupData as PendingSignup | null;
        if (!pending) throw new Error('Missing signup data');
        const res = await api.signup({ name: pending.name, email: pending.email, phone: pending.phone });
        if (res.user) setUser(res.user);
        (window as any).pendingSignupData = null;
        toast.success('Account created successfully!');
      }

      onSuccess();
    } catch (e: any) {
      reset();
      const msg = e?.code === 'auth/invalid-verification-code'
        ? 'Invalid code. Please try again.'
        : e?.code === 'auth/code-expired'
          ? 'Code expired. Please resend.'
          : (e.message || 'Verification failed');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      if ((window as any).modalRecaptchaVerifier) {
        try { (window as any).modalRecaptchaVerifier.clear(); } catch {}
        (window as any).modalRecaptchaVerifier = undefined;
      }
      (window as any).modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modal-recaptcha', { size: 'invisible' });

      let confirmationResult;
      if (isSignup && auth.currentUser) {
        confirmationResult = await linkWithPhoneNumber(auth.currentUser, phone, (window as any).modalRecaptchaVerifier);
      } else {
        confirmationResult = await signInWithPhoneNumber(auth, phone, (window as any).modalRecaptchaVerifier);
      }
      (window as any).confirmationResult = confirmationResult;
      reset();
      setResendCooldown(60);
      toast.success('New OTP sent! Please enter the new code.');
    } catch (e: any) {
      toast.error(e.message || 'Resend failed');
      if ((window as any).modalRecaptchaVerifier) {
        try { (window as any).modalRecaptchaVerifier.clear(); } catch {}
        (window as any).modalRecaptchaVerifier = undefined;
      }
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = phone.length <= 4 ? '****' : phone.slice(0, 4) + '****' + phone.slice(-2);

  return (
    <div className={s.verifyCenter}>
      {isSignup && (
        <div style={{ marginBottom: '16px', textAlign: 'left', backgroundColor: tokens.colorBrandBackground2, padding: '12px', borderRadius: '8px' }}>
          <Text style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Step 2 of 2</Text>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', listStyle: 'none' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', color: tokens.colorPaletteGreenForeground1 }}>
              <CheckmarkCircle24Filled />
              Email Verified
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: tokens.colorBrandForeground1, fontWeight: 600 }}>
              <PhoneRegular />
              Verify Phone (current)
            </li>
          </ul>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', justifyContent: 'center' }}>
        <PhoneRegular />
        <Text style={{ fontSize: '13px' }}>Code sent to <strong>{maskedPhone}</strong></Text>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className={s.verifyForm}>
        <div className={s.inputGroup}>
          <label htmlFor="modal-otp" className={s.label}>Verification code</label>
          <Input id="modal-otp" type="text" maxLength={6} placeholder="000000" autoComplete="one-time-code" {...register('code')} />
          {errors.code && <span className={s.fieldError} role="alert">{errors.code.message}</span>}
        </div>
        <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Verifying\u2026' : 'Verify Phone'}
        </Button>
        <Button appearance="secondary" onClick={onResend} disabled={resendCooldown > 0 || loading} style={{ width: '100%' }}>
          {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Phone OTP'}
        </Button>
      </form>

      <div className={s.switchRow}>
        <button type="button" className={s.link} onClick={onBack}>
          {isSignup ? 'Cancel and start over' : '\u2190 Back to Login'}
        </button>
      </div>
    </div>
  );
}

// ---- Main Modal ----

export function AuthModal() {
  const { open, closeModal, onAuthSuccess } = useAuthModal();
  const s = useStyles();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<ModalView>('login');
  const [pendingData, setPendingData] = useState<PendingSignup | null>(null);
  const [loginPhone, setLoginPhone] = useState('');
  const signupFinalizedRef = useRef(false);

  const cleanupAndReset = useCallback(async () => {
    if ((window as any).pendingSignupData && !signupFinalizedRef.current) {
      const user = auth.currentUser;
      if (user) {
        try { await deleteUser(user); } catch {}
      }
      (window as any).pendingSignupData = null;
    }
    setPendingData(null);
    setLoginPhone('');
    setView('login');
    signupFinalizedRef.current = false;
  }, []);

  const handleOpenChange = useCallback((_e: unknown, data: { open: boolean }) => {
    if (!data.open) {
      closeModal();
      cleanupAndReset();
    }
  }, [closeModal, cleanupAndReset]);

  const handleAuthSuccess = useCallback(async () => {
    signupFinalizedRef.current = true;
    (window as any).pendingSignupData = null;
    await dispatch(fetchUser());
    setPendingData(null);
    setLoginPhone('');
    setView('login');
    onAuthSuccess();
  }, [onAuthSuccess, dispatch]);

  // SignupView → email verified → send phone OTP → verify-phone
  const handleEmailVerified = useCallback(async () => {
    if (!pendingData || !auth.currentUser) return;
    try {
      if ((window as any).modalRecaptchaVerifier) {
        try { (window as any).modalRecaptchaVerifier.clear(); } catch {}
        (window as any).modalRecaptchaVerifier = undefined;
      }
      (window as any).modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modal-recaptcha', { size: 'invisible' });
      await auth.currentUser.getIdToken(true);
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, pendingData.phone, (window as any).modalRecaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;
      setView('verify-phone');
      toast.success('OTP sent to your phone!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send phone OTP.');
    }
  }, [pendingData]);

  const title =
    view === 'login' ? 'Welcome Back'
    : view === 'signup' ? 'Create Account'
    : view === 'verify-email' ? 'Verify Email'
    : 'Verify Phone';

  const subtitle =
    view === 'login' ? 'Please login to continue'
    : view === 'signup' ? 'Enter your details to sign up'
    : '';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} modalType="modal">
      <DialogSurface className={s.surface}>
        <DialogBody className={s.body}>
          <div className={s.titleRow}>
            <DialogTitle action={null}>{title}</DialogTitle>
            <Button
              appearance="subtle"
              icon={<Dismiss24Regular />}
              onClick={async () => { closeModal(); await cleanupAndReset(); }}
              aria-label="Close"
              size="small"
            />
          </div>
          {subtitle && <Text className={s.subtitle}>{subtitle}</Text>}
          <DialogContent style={{ padding: 0 }}>
            <div id="modal-recaptcha"></div>

            {view === 'login' && (
              <LoginView
                onSwitchToSignup={() => setView('signup')}
                onLoginSuccess={handleAuthSuccess}
                onPhoneOtp={(phone) => { setLoginPhone(phone); setView('verify-login-otp'); }}
                styles={s}
              />
            )}

            {view === 'signup' && (
              <SignupView
                onSwitchToLogin={() => setView('login')}
                onEmailVerify={(data) => { setPendingData(data); setView('verify-email'); }}
                styles={s}
              />
            )}

            {view === 'verify-email' && pendingData && (
              <VerifyEmailView
                pendingData={pendingData}
                onEmailVerified={handleEmailVerified}
                onCancel={cleanupAndReset}
                styles={s}
              />
            )}

            {view === 'verify-phone' && pendingData && (
              <VerifyPhoneView
                phone={pendingData.phone}
                isSignup={true}
                onSuccess={handleAuthSuccess}
                onBack={cleanupAndReset}
                styles={s}
              />
            )}

            {view === 'verify-login-otp' && (
              <VerifyPhoneView
                phone={loginPhone}
                isSignup={false}
                onSuccess={handleAuthSuccess}
                onBack={cleanupAndReset}
                styles={s}
              />
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

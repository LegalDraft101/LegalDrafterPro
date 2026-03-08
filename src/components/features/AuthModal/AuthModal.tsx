import { useState, useEffect, useCallback } from 'react';
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
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import { Dismiss24Regular, EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { useAuthModal } from './AuthModalContext';
import { api } from '../../../api/index';
import { auth } from '../../../lib/firebase';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { emailSchema, passwordSchema, isEmailTechnicallyCorrect } from '../../../lib/validation';
import { GoogleIcon } from '../../common/Shared/Shared';

const INDIA_PREFIX = '+91';

type ModalView = 'login' | 'signup' | 'verify';

interface VerifyState {
  channel: 'email' | 'phone';
  email?: string;
  phone?: string;
  target: string;
}

// ---- Zod schemas (same as auth pages) ----

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

const verifySchema = z.object({
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
  otpChannelRow: {
    marginTop: '4px',
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

// ---- Sub-views ----

import { fetchUser } from '../../../store/slices/authSlice';
import { useAppDispatch } from '../../../store/hooks';

function LoginView({
  onSwitchToSignup,
  onVerify,
  styles: s,
}: {
  onSwitchToSignup: () => void;
  onVerify: (state: VerifyState) => void;
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

        // Wait a tiny bit for the auth state token to be registered in axios interceptors
        setTimeout(async () => {
          await dispatch(fetchUser());
          toast.success('Logged in successfully!');
          onVerify({ channel: 'email', target: 'success' });
        }, 500);
      } else {
        const normalized = trimmed.replace(/\D/g, '').length === 10 ? '+91' + trimmed.replace(/\D/g, '') : trimmed;

        if (!(window as any).modalRecaptchaVerifier) {
          (window as any).modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modal-recaptcha', {
            size: 'invisible',
          });
        }

        const confirmationResult = await signInWithPhoneNumber(auth, normalized, (window as any).modalRecaptchaVerifier);
        (window as any).confirmationResult = confirmationResult;

        toast.success('OTP sent to your phone.');
        onVerify({
          channel: 'phone',
          phone: normalized,
          target: normalized,
        });
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
      toast.success('Logged in with Google!');
      onVerify({ channel: 'email', target: 'success' }); // trigger success 
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

function SignupView({
  onSwitchToLogin,
  onVerify,
  styles: s,
}: {
  onSwitchToLogin: () => void;
  onVerify: (state: VerifyState) => void;
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

      // Gracefully handle partial signups where Firebase has the user but DB does not.
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, emailVal, data.password);
        try { await updateProfile(userCredential.user, { displayName: data.name.trim() }); } catch (err) { }
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          try {
            // Attempt to login to get the currentUser so they can finish verification
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

      // We do not immediately call backend api.signup yet, because they need both email and phone verified.
      // We start the Phone verification flow via Recaptcha and Firebase
      if (!(window as any).modalRecaptchaVerifier) {
        (window as any).modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modal-recaptcha', {
          size: 'invisible',
        });
      }

      const confirmationResult = await signInWithPhoneNumber(auth, phoneVal, (window as any).modalRecaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;

      toast.success('Successfully created credentials. Now verifying...', { duration: 3000 });

      // Store info to be sent to backend later
      (window as any).pendingSignupData = {
        name: data.name.trim(),
        email: emailVal,
        phone: phoneVal,
      };

      onVerify({ channel: 'phone', target: phoneVal });
    } catch (e: any) {
      toast.error(e.message || 'Signup failed');
      if ((window as any).modalRecaptchaVerifier) {
        (window as any).modalRecaptchaVerifier.clear();
        (window as any).modalRecaptchaVerifier = undefined;
      }
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
            {loading ? 'Processing...' : 'Verify Email & Phone'}
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

import { sendEmailVerification } from 'firebase/auth';

import { useAuth } from '../../../hooks/useAuth';

function VerifyView({
  verifyState,
  onBack,
  onSuccess,
  styles: s,
}: {
  verifyState: VerifyState;
  onBack: () => void;
  onSuccess: () => void;
  styles: ReturnType<typeof useStyles>;
}) {
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const { setUser } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
  });

  // Track if this is a first-time signup flow
  const isSignupFlow = !!(window as any).pendingSignupData;

  useEffect(() => {
    // Attempt to automatically check email verification status
    let interval: NodeJS.Timeout;
    if (isSignupFlow && !emailVerified && auth.currentUser) {
      interval = setInterval(async () => {
        await auth.currentUser?.reload();
        if (auth.currentUser?.emailVerified) {
          setEmailVerified(true);
          toast.success("Email verified!");
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSignupFlow, emailVerified]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const finalizeSignup = async () => {
    try {
      setLoading(true);
      const data = (window as any).pendingSignupData;
      if (!data) throw new Error("Missing signup data");

      // Token is automatically injected by frontend axios interceptor if auth.currentUser exists
      // The backend will now verify the Firebase token
      const res = await api.signup({
        name: data.name,
        email: data.email,
        phone: data.phone,
      });

      if (res.user) {
        setUser(res.user);
      }

      toast.success('Account created and verified successfully!');
      (window as any).pendingSignupData = null; // Clear
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || 'Finalizing backend signup failed');
    } finally {
      setLoading(false);
    }
  };

  // We automatically finalize when both are verified in a signup flow
  useEffect(() => {
    if (isSignupFlow && phoneVerified && emailVerified && auth.currentUser) {
      finalizeSignup();
    }
  }, [phoneVerified, emailVerified, isSignupFlow]);


  const onSubmit = async (data: z.infer<typeof verifySchema>) => {
    setLoading(true);
    try {
      const cr = (window as any).confirmationResult;
      if (!cr) throw new Error('No active verification session.');
      await cr.confirm(data.code);
      toast.success('Phone verified.');
      setPhoneVerified(true);

      if (!isSignupFlow) {
        // Just a standard login flow
        onSuccess();
      } else {
        // If it's signup, we also need to enforce email checking.
        if (auth.currentUser && !auth.currentUser.emailVerified) {
          await sendEmailVerification(auth.currentUser);
          toast.info('Verification link sent to your email. Please click it to continue.');
        } else if (auth.currentUser && auth.currentUser.emailVerified) {
          setEmailVerified(true);
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Invalid or expired code');
    } finally {
      setLoading(false);
    }
  };

  const onResendPhone = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    try {
      if (!(window as any).modalRecaptchaVerifier) {
        (window as any).modalRecaptchaVerifier = new RecaptchaVerifier(auth, 'modal-recaptcha', { size: 'invisible' });
      }
      const confirmationResult = await signInWithPhoneNumber(auth, verifyState.target, (window as any).modalRecaptchaVerifier);
      (window as any).confirmationResult = confirmationResult;
      toast.success('Phone code sent again.');
      setResendCooldown(60);
    } catch (e: any) {
      toast.error(e.message || 'Resend failed');
    } finally {
      setLoading(false);
    }
  };

  const onResendEmail = async () => {
    if (!auth.currentUser) return;
    try {
      await sendEmailVerification(auth.currentUser);
      toast.success('Email verification resent!');
    } catch (e: any) {
      toast.error(e.message || 'Could not resend email.');
    }
  };

  const maskedTarget = verifyState.target.length <= 4
    ? '****'
    : verifyState.target.slice(0, 2) + '****' + verifyState.target.slice(-2);

  return (
    <div className={s.verifyCenter}>
      {isSignupFlow && (
        <div style={{ marginBottom: '16px', textAlign: 'left', backgroundColor: tokens.colorBrandBackground2, padding: '12px', borderRadius: '8px' }}>
          <Text style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>Complete Registration</Text>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px' }}>
            <li style={{ color: phoneVerified ? tokens.colorPaletteGreenForeground1 : tokens.colorNeutralForeground1 }}>
              {phoneVerified ? '✅ Phone Verified' : '⏳ Verify Phone OTP'}
            </li>
            <li style={{ color: emailVerified ? tokens.colorPaletteGreenForeground1 : tokens.colorNeutralForeground1, marginTop: '4px' }}>
              {emailVerified ? '✅ Email Verified' : '⏳ Click verification link sent to email'}
            </li>
          </ul>
        </div>
      )}

      {(!isSignupFlow || !phoneVerified) && (
        <>
          <Text className={s.subtitle}>We sent a 6-digit phone code to {maskedTarget}</Text>
          <form onSubmit={handleSubmit(onSubmit)} className={s.verifyForm}>
            <div className={s.inputGroup}>
              <label htmlFor="modal-code" className={s.label}>Verification code</label>
              <Input id="modal-code" type="text" maxLength={6} placeholder="000000" autoComplete="one-time-code" disabled={phoneVerified} {...register('code')} />
              {errors.code && <span className={s.fieldError} role="alert">{errors.code.message}</span>}
            </div>
            <Button type="submit" appearance="primary" disabled={loading || phoneVerified} style={{ width: '100%' }}>
              {loading ? 'Verifying\u2026' : 'Verify Phone'}
            </Button>
            <Button appearance="outline" onClick={onResendPhone} disabled={resendCooldown > 0 || loading || phoneVerified} style={{ width: '100%' }}>
              {resendCooldown > 0 ? `Resend Phone OTP in ${resendCooldown}s` : 'Resend Phone OTP'}
            </Button>
          </form>
        </>
      )}

      {isSignupFlow && phoneVerified && !emailVerified && (
        <div style={{ marginTop: '20px' }}>
          <Text style={{ display: 'block', marginBottom: '12px' }}>Waiting for email verification...</Text>
          <Button appearance="outline" onClick={onResendEmail} style={{ width: '100%' }}>
            Resend Verification Email
          </Button>
        </div>
      )}

      <div className={s.switchRow}>
        <button type="button" className={s.link} onClick={onBack}>&larr; Back to Login</button>
      </div>
    </div>
  );
}

// ---- Main modal ----

export function AuthModal() {
  const { open, closeModal, onAuthSuccess } = useAuthModal();
  const s = useStyles();
  const [view, setView] = useState<ModalView>('login');
  const [verifyState, setVerifyState] = useState<VerifyState | null>(null);

  const resetState = useCallback(() => {
    setView('login');
    setVerifyState(null);
    (window as any).pendingSignupData = null; // Clear any partial signup data
  }, []);

  const handleOpenChange = useCallback((_e: unknown, data: { open: boolean }) => {
    if (!data.open) {
      closeModal();
      resetState();
    }
  }, [closeModal, resetState]);

  const handleAuthSuccess = useCallback(() => {
    resetState();
    onAuthSuccess();
  }, [resetState, onAuthSuccess]);

  const goToVerify = useCallback((state: VerifyState) => {
    if (state.target === 'success') {
      handleAuthSuccess();
    } else {
      setVerifyState(state);
      setView('verify');
    }
  }, [handleAuthSuccess]);

  const title = view === 'login' ? 'Welcome Back' : view === 'signup' ? 'Create Account' : 'Verify Your Account';
  const subtitle = view === 'login'
    ? 'Please login to continue'
    : view === 'signup'
      ? 'Enter your details to sign up'
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
              onClick={() => { closeModal(); resetState(); }}
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
                onVerify={goToVerify}
                styles={s}
              />
            )}
            {view === 'signup' && (
              <SignupView
                onSwitchToLogin={() => setView('login')}
                onVerify={goToVerify}
                styles={s}
              />
            )}
            {view === 'verify' && verifyState && (
              <VerifyView
                verifyState={verifyState}
                onBack={resetState}
                onSuccess={handleAuthSuccess}
                styles={s}
              />
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

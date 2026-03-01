/**
 * All auth pages: Login, Signup, ForgotPassword, VerifyOtp, Account.
 * Converted from SCSS modules to Fluent UI components + makeStyles.
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  makeStyles,
  tokens,
  Button,
  Input,
  Card,
  Title2,
  Text,
  RadioGroup,
  Radio,
  MessageBar,
  MessageBarBody,
  Divider,
  Spinner,
} from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { AuthLayout, GoogleIcon } from '../components/Shared';
import { useAuth } from '../hooks/useAuth';
import { api, getGoogleAuthUrl, type SignupOtpChannel } from '../api/index';
import { emailSchema, isEmailTechnicallyCorrect, passwordSchema } from '../lib/validation';

const INDIA_PREFIX = '+91';

const useAuthFormStyles = makeStyles({
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
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  visibilityBtn: {
    position: 'absolute',
    right: '4px',
  },
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  forgotLink: {
    fontSize: '13px',
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    ':hover': { textDecoration: 'underline' },
  },
  submitRow: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: tokens.colorNeutralForeground4,
    margin: '12px 0',
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
});

const usePageStyles = makeStyles({
  verifyWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  verifyCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 32px',
    textAlign: 'center' as const,
    borderRadius: '16px',
    boxShadow: tokens.shadow16,
  },
  verifyHeading: {
    margin: '0 0 8px 0',
  },
  verifySubheading: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    margin: '0 0 24px 0',
  },
  verifyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left' as const,
  },
  verifyInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  verifyError: {
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
  },
  verifyBackLinks: {
    marginTop: '20px',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    color: tokens.colorNeutralForeground4,
  },
  verifyBackLink: {
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    ':hover': { textDecoration: 'underline' },
  },
  accountWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  accountCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px 32px',
    borderRadius: '16px',
    boxShadow: tokens.shadow16,
  },
  accountHeading: {
    margin: '0 0 24px 0',
  },
  accountDl: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '8px 20px',
    fontSize: '14px',
    marginBottom: '24px',
    '& dt': { fontWeight: 600, color: tokens.colorNeutralForeground3 },
    '& dd': { margin: 0, color: tokens.colorNeutralForeground1 },
  },
});

// ----- Login -----
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
  password: z.string().refine((val) => !val || passwordSchema.safeParse(val).success,
    'Password must have uppercase, lowercase and a number'
  ),
});

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const s = useAuthFormStyles();
  const { register, handleSubmit, clearErrors, watch, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });
  const emailOrPhoneValue = watch('emailOrPhone', '');
  const passwordValue = watch('password', '');
  const isEmailField = (emailOrPhoneValue || '').trim().includes('@');
  const emailValid = isEmailField && isEmailTechnicallyCorrect(emailOrPhoneValue);
  void emailValid;
  const urlError = searchParams.get('error');
  const isGoogleNotConfigured = urlError === 'google_not_configured';
  const isGoogleFailed = urlError === 'google_failed';

  useEffect(() => {
    if (urlError === 'google_failed') {
      toast.error('Google sign-in failed. Please try again or use email/phone.');
      setSearchParams({}, { replace: true });
    }
  }, [urlError, setSearchParams]);

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    const start = Date.now();
    try {
      const trimmed = data.emailOrPhone.trim();
      const isEmail = trimmed.includes('@');
      const normalized = isEmail ? trimmed : (trimmed.replace(/\D/g, '').length === 10 ? '+91' + trimmed.replace(/\D/g, '') : trimmed);
      await api.login({ emailOrPhone: normalized });
      toast.success('If an account exists, you will receive a code.');
      navigate('/verify', { state: { emailOrPhone: normalized, channel: isEmail ? 'email' : 'phone', email: isEmail ? normalized : undefined, phone: isEmail ? undefined : normalized } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Request failed';
      toast.error(msg.toLowerCase().includes('invalid input') ? 'Invalid email' : msg);
    } finally {
      setTimeout(() => setLoading(false), Math.max(0, 2000 - (Date.now() - start)));
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit, () => toast.error('Please fix the errors below.'))(e);
  };

  const handleGoogle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = getGoogleAuthUrl();
    if (!url) { toast.error('Cannot redirect. Try again.'); return; }
    window.location.href = url;
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Please login to your account"
      backLink={{ label: 'Back to home', to: '/' }}
      signupPrompt={{ text: "Don't have an account? ", linkText: 'Signup', to: '/signup' }}
      extra={
        <>
          {isGoogleNotConfigured && (
            <MessageBar intent="error" role="alert" style={{ marginBottom: 12 }}>
              <MessageBarBody>Login with Google is not configured. Use email/phone below.</MessageBarBody>
            </MessageBar>
          )}
          {isGoogleFailed && (
            <MessageBar intent="error" role="alert" style={{ marginBottom: 12 }}>
              <MessageBarBody>Google sign-in failed. Try again or use email/phone below.</MessageBarBody>
            </MessageBar>
          )}
          <Divider style={{ margin: '16px 0' }}>Or Login with</Divider>
          <div className={s.socialRow}>
            <Button appearance="outline" icon={<GoogleIcon size={18} />} onClick={handleGoogle} aria-label="Login with Google">
              Google
            </Button>
          </div>
        </>
      }
    >
      <form onSubmit={onFormSubmit} noValidate>
        <div className={s.inputGroup}>
          <label htmlFor="emailOrPhone" className={s.label}>Email address</label>
          <Input
            id="emailOrPhone"
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
          <label htmlFor="password" className={s.label}>Password</label>
          <div className={s.inputWrapper}>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              style={{ width: '100%' }}
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
          </div>
          {errors.password && (
            <div className={s.errorBox} role="alert">
              <span className={s.errorIcon} aria-hidden>!</span>
              <span>
                {String(passwordValue ?? '').trim().length < 8 ? 'Minimum 8 characters' : 'Password must have uppercase, lowercase and a number'}
              </span>
            </div>
          )}
        </div>
        <div className={s.forgotRow}>
          <Link to="/forgot-password" className={s.forgotLink}>Forgot password?</Link>
        </div>
        <div className={s.submitRow}>
          <Button type="submit" appearance="primary" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Sending…' : 'Login'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}

// ----- Signup -----
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

// ----- ForgotPassword -----
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

// ----- VerifyOtp -----
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

// ----- Account -----
function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const p = usePageStyles();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in.');
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className={p.accountWrapper}>
        <Card className={p.accountCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner label="Loading…" />
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={p.accountWrapper}>
      <Card className={p.accountCard}>
        <Title2 className={p.accountHeading}>My Account</Title2>
        <dl className={p.accountDl}>
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Phone</dt>
          <dd>{maskPhone(user.phone) || '—'}</dd>
        </dl>
        <Button appearance="outline" onClick={() => logout()}>Logout</Button>
      </Card>
    </div>
  );
}

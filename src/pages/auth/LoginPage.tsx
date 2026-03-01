import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Input,
  Divider,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components';
import { EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { AuthLayout, GoogleIcon } from '../../components/common/Shared/Shared';
import { api, getGoogleAuthUrl } from '../../api/index';
import { emailSchema, isEmailTechnicallyCorrect, passwordSchema } from '../../lib/validation';
import { useAuthFormStyles } from './authStyles';

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

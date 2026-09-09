import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@fluentui/react-components';
import { GoogleAuthProvider, signInWithPopup, type ConfirmationResult } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { api } from '../../api';
import { fetchUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { AuthLayout, GoogleIcon } from '../../components/common/Shared/Shared';
import { useAuthFormStyles } from './authStyles';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import { sendOtp, verifyOtp } from '../../lib/firebasePhone';

const normalizePhone = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  return value.trim();
};

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const styles = useAuthFormStyles();
  const [mode, setMode] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpId, setOtpId] = useState('');
  const [loading, setLoading] = useState(false);
  const [phoneConfirmation, setPhoneConfirmation] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const finish = async (keepFirebaseSession = false) => {
    if (!keepFirebaseSession) await signOut(auth).catch(() => undefined);
    await dispatch(fetchUser());
    navigate('/');
  };

  const submit = async () => {
    setLoading(true);
    try {
      if (otpId) {
        await api.emailLoginVerify({ otpId, code });
        await finish();
        return;
      }

      if (mode === 'phone') {
        if (!phoneConfirmation) {
          const e164 = normalizePhone(identifier);
          if (!/^\+[1-9]\d{7,14}$/.test(e164)) {
            toast.error('Enter a valid phone number in E.164 format.');
            return;
          }
          const confirmation = await sendOtp(e164);
          setPhoneConfirmation(confirmation);
          setOtpSent(true);
          toast.success(`OTP sent to ${e164}`);
          return;
        }

        const { idToken } = await verifyOtp(phoneConfirmation, code);
        if (!idToken) {
          throw new Error('No Firebase ID token returned.');
        }
        await api.verifyPhone();
        await finish(true);
        return;
      }

      const email = identifier.trim().toLowerCase();
      if (!emailOtpSent) {
        await api.emailOtpSend(email);
        setEmailOtpSent(true);
        setResendSeconds(45);
        toast.success('Verification code sent to your email.');
      } else {
        await api.emailOtpVerify(email, code);
        await finish();
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const google = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      await api.googleCreate();
      await finish(true);
    } catch (error: any) {
      toast.error(error.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  const resetPhoneFlow = () => {
    setPhoneConfirmation(null);
    setOtpSent(false);
    setCode('');
  };

  const resendEmailOtp = async () => {
    setLoading(true);
    try {
      await api.emailOtpSend(identifier.trim().toLowerCase());
      setCode('');
      setResendSeconds(45);
      toast.success('A new verification code was sent.');
    } catch (error: any) {
      toast.error(error.message || 'Unable to resend the verification code.');
    } finally {
      setLoading(false);
    }
  };

  const resetEmailFlow = () => {
    setEmailOtpSent(false);
    setResendSeconds(0);
    setCode('');
  };

  return <AuthLayout title="Welcome Back" subtitle="Sign in with Google, phone, or email" backLink={{ label: 'Back to home', to: '/' }} signupPrompt={{ text: "Don't have an account? ", linkText: 'Signup', to: '/signup' }} extra={<><div className="divider">Or continue with</div><button type="button" className="google-btn" onClick={google}><GoogleIcon size={18} /> Continue with Google</button></>}>
    <div className={styles.socialRow}><Button appearance={mode === 'phone' ? 'primary' : 'outline'} onClick={() => { setMode('phone'); setOtpId(''); resetPhoneFlow(); resetEmailFlow(); }}>Phone</Button><Button appearance={mode === 'email' ? 'primary' : 'outline'} onClick={() => { setMode('email'); setOtpId(''); resetPhoneFlow(); resetEmailFlow(); }}>Email</Button></div>

    {mode === 'phone' ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {!otpSent ? (
          <div className={styles.inputGroup}>
            <label className={styles.label}>Phone Number</label>
            <Input value={identifier} onChange={(_, data) => setIdentifier(data.value)} placeholder="+91 ________" />
          </div>
        ) : (
          <>
            <div className={styles.inputGroup}>
              <label className={styles.label}>OTP sent to {normalizePhone(identifier) || 'your phone'}</label>
              <Input value={code} onChange={(_, data) => setCode(data.value)} placeholder="Enter OTP" inputMode="numeric" maxLength={6} />
            </div>
            <Button appearance="subtle" disabled={loading} onClick={resetPhoneFlow} style={{ width: '100%' }}>Change phone number</Button>
          </>
        )}
      </div>
    ) : (
      <>
        <div className={styles.inputGroup}><label className={styles.label}>Email address</label><Input value={identifier} onChange={(_, data) => setIdentifier(data.value)} placeholder="user@example.com" disabled={emailOtpSent} /></div>
        {emailOtpSent && <div className={styles.inputGroup}><label className={styles.label}>Enter the 6-digit code sent to {identifier.trim().toLowerCase()}</label><Input value={code} onChange={(_, data) => setCode(data.value)} placeholder="000000" inputMode="numeric" maxLength={6} /></div>}
        {emailOtpSent && <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}><Button appearance="subtle" disabled={loading || resendSeconds > 0} onClick={resendEmailOtp}>{resendSeconds > 0 ? `Resend OTP in ${resendSeconds}s` : 'Resend OTP'}</Button><Button appearance="subtle" disabled={loading} onClick={resetEmailFlow}>Change email</Button></div>}
      </>
    )}

    <Button appearance="primary" disabled={loading} onClick={submit} style={{ width: '100%' }}>
      {mode === 'phone' ? (otpSent ? 'Verify OTP' : 'Send OTP') : emailOtpSent ? 'Verify Email' : 'Send OTP'}
    </Button>
  </AuthLayout>;
}

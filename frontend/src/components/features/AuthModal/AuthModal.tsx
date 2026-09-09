import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent, Button, Input, Divider, Text, makeStyles, tokens } from '@fluentui/react-components';
import { Dismiss24Regular, EyeRegular, EyeOffRegular } from '@fluentui/react-icons';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import { api } from '../../../api/index';
import { GoogleIcon } from '../../common/Shared/Shared';
import { fetchUser } from '../../../store/slices/authSlice';
import { useAppDispatch } from '../../../store/hooks';
import { useAuthModal } from './AuthModalContext';

const useStyles = makeStyles({
  surface: { width: '100%', maxWidth: '460px', maxHeight: '90vh', borderRadius: '16px', padding: 0 },
  body: { padding: '28px 32px 24px', overflowY: 'auto', '@media (max-width: 480px)': { padding: '20px 16px 16px' } },
  titleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' },
  subtitle: { fontSize: '14px', color: tokens.colorNeutralForeground3, marginBottom: '20px', display: 'block' },
  group: { display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' },
  label: { fontSize: '13px', fontWeight: 500 },
  error: { fontSize: '12px', color: tokens.colorPaletteRedForeground1 },
  row: { display: 'flex', gap: '8px', marginBottom: '16px' },
  link: { background: 'none', border: 0, padding: 0, color: tokens.colorBrandForegroundLink, fontWeight: 600, cursor: 'pointer' },
  center: { textAlign: 'center' as const },
});

type Mode = 'phone' | 'email';
type View = 'login' | 'signup' | 'otp';

function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : value.replace(/\s/g, '');
}

function validPassword(value: string): boolean { return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value); }

export function AuthModal() {
  const { open, closeModal, onAuthSuccess } = useAuthModal();
  const styles = useStyles();
  const dispatch = useAppDispatch();
  const [view, setView] = useState<View>('login');
  const [mode, setMode] = useState<Mode>('phone');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpId, setOtpId] = useState('');
  const [code, setCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'signup' | 'login'>('login');

  const reset = () => { setView('login'); setMode('phone'); setLoading(false); setName(''); setEmail(''); setPhone(''); setPassword(''); setOtpId(''); setCode(''); };
  const finish = async () => { await signOut(auth).catch(() => undefined); await dispatch(fetchUser()); reset(); onAuthSuccess(); };
  const submit = async () => {
    setLoading(true);
    try {
      if (!validPassword(password)) throw new Error('Password must be 8+ characters with uppercase, lowercase, and a number.');
      if (view === 'login' && mode === 'phone') { await api.phoneLogin({ phone: normalizePhone(phone), password }); await finish(); return; }
      if (view === 'signup' && mode === 'phone') { await api.phoneSignup({ name: name.trim(), phone: normalizePhone(phone), password }); await finish(); return; }
      if (view === 'login' && mode === 'email') {
        const result = await api.emailLoginRequest({ email: email.trim().toLowerCase(), password });
        setOtpPurpose('login'); setOtpId(result.otpId); setView('otp'); toast.success('Verification code sent to your email.'); return;
      }
      const result = await api.emailSignupRequest({ name: name.trim(), email: email.trim().toLowerCase(), password });
      setOtpPurpose('signup'); setOtpId(result.otpId); setView('otp'); toast.success('Verification code sent to your email.');
    } catch (error: any) { toast.error(error.message || 'Authentication failed.'); }
    finally { setLoading(false); }
  };
  const verify = async () => {
    setLoading(true);
    try {
      if (!/^\d{6}$/.test(code)) throw new Error('Enter the 6-digit verification code.');
      if (otpPurpose === 'login') await api.emailLoginVerify({ otpId, code });
      else await api.emailSignupVerify({ otpId, code });
      await finish();
    } catch (error: any) { toast.error(error.message || 'Verification failed.'); }
    finally { setLoading(false); }
  };
  const googleLogin = async () => {
    setLoading(true);
    try { await signInWithPopup(auth, new GoogleAuthProvider()); await api.googleCreate(); await finish(); }
    catch (error: any) { toast.error(error.message || 'Google sign-in failed.'); }
    finally { setLoading(false); }
  };

  const title = view === 'otp' ? 'Verify email' : view === 'signup' ? 'Create account' : 'Welcome back';
  const subtitle = view === 'otp' ? `Enter the code sent to ${email}` : view === 'signup' ? 'Choose an independent account method' : 'Sign in with Google, phone, or email';
  const Field = ({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) => (
    <div className={styles.group}><label className={styles.label}>{label}</label><Input type={type} value={value} placeholder={placeholder} onChange={(_, data) => onChange(data.value)} autoComplete={type === 'password' ? 'current-password' : undefined} /></div>
  );

  return <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) { closeModal(); reset(); } }} modalType="modal">
    <DialogSurface className={styles.surface}><DialogBody className={styles.body}>
      <div className={styles.titleRow}><DialogTitle>{title}</DialogTitle><Button appearance="subtle" icon={<Dismiss24Regular />} onClick={() => { closeModal(); reset(); }} aria-label="Close" /></div>
      <Text className={styles.subtitle}>{subtitle}</Text><DialogContent style={{ padding: 0 }}>
        {view === 'otp' ? <div className={styles.center}>
          <Field label="Email verification code" value={code} onChange={setCode} placeholder="000000" />
          <Button appearance="primary" disabled={loading} onClick={verify} style={{ width: '100%' }}>{loading ? 'Verifying...' : 'Verify and continue'}</Button>
          <p><button className={styles.link} onClick={() => setView('login')}>Back</button></p>
        </div> : <>
          <div className={styles.row}><Button appearance={mode === 'phone' ? 'primary' : 'outline'} onClick={() => setMode('phone')}>Phone</Button><Button appearance={mode === 'email' ? 'primary' : 'outline'} onClick={() => setMode('email')}>Email</Button></div>
          {view === 'signup' && <Field label="Name" value={name} onChange={setName} placeholder="Your name" />}
          {mode === 'email' ? <Field label="Email address" value={email} onChange={setEmail} type="email" placeholder="you@example.com" /> : <Field label="Phone number" value={phone} onChange={setPhone} type="tel" placeholder="9876543210" />}
          <div className={styles.group}><label className={styles.label}>Password</label><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(_, data) => setPassword(data.value)} contentAfter={<Button appearance="transparent" icon={showPassword ? <EyeOffRegular /> : <EyeRegular />} onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility" />} /></div>
          <Button appearance="primary" disabled={loading} onClick={submit} style={{ width: '100%' }}>{loading ? 'Processing...' : view === 'signup' && mode === 'email' ? 'Send email code' : view === 'login' && mode === 'email' ? 'Send login code' : view === 'signup' ? 'Create account' : 'Login'}</Button>
          {view === 'login' && <><Divider style={{ margin: '16px 0' }}>Or</Divider><Button appearance="outline" icon={<GoogleIcon size={18} />} onClick={googleLogin} disabled={loading} style={{ width: '100%' }}>Continue with Google</Button></>}
          <p className={styles.center}>{view === 'login' ? <>Need an account? <button className={styles.link} onClick={() => setView('signup')}>Sign up</button></> : <>Already registered? <button className={styles.link} onClick={() => setView('login')}>Login</button></>}</p>
        </>}
      </DialogContent>
    </DialogBody></DialogSurface>
  </Dialog>;
}

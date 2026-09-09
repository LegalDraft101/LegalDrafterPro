import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input } from '@fluentui/react-components';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { AuthLayout, GoogleIcon } from '../../components/common/Shared/Shared';
import { useAuthFormStyles } from './authStyles';
import { api } from '../../api';
import { fetchUser } from '../../store/slices/authSlice';
import { useAppDispatch } from '../../store/hooks';
import { toast } from 'sonner';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const phone = (value: string) => value.replace(/\D/g, '').length === 10 ? `+91${value.replace(/\D/g, '')}` : value.trim();
export function SignupPage() {
  const navigate = useNavigate(); const dispatch = useAppDispatch(); const styles = useAuthFormStyles();
  const [mode, setMode] = useState<'phone' | 'email'>('phone'); const [name, setName] = useState(''); const [identifier, setIdentifier] = useState(''); const [password, setPassword] = useState(''); const [code, setCode] = useState(''); const [otpId, setOtpId] = useState(''); const [loading, setLoading] = useState(false);
  const finish = async (keepFirebaseSession = false) => { if (!keepFirebaseSession) await signOut(auth).catch(() => undefined); await dispatch(fetchUser()); navigate('/'); };
  const google = async () => { setLoading(true); try { await signInWithPopup(auth, new GoogleAuthProvider()); await api.googleCreate(); await finish(true); } catch (error: any) { toast.error(error.message || 'Google sign-in failed.'); } finally { setLoading(false); } };
  const submit = async () => { setLoading(true); try { if (otpId) { await api.emailSignupVerify({ otpId, code }); await finish(); return; } if (mode === 'phone') { await api.phoneSignup({ name: name.trim(), phone: phone(identifier), password }); await finish(); } else { const result = await api.emailSignupRequest({ name: name.trim(), email: identifier.trim().toLowerCase(), password }); setOtpId(result.otpId); toast.success('Verification code sent to your email.'); } } catch (error: any) { toast.error(error.message || 'Signup failed.'); } finally { setLoading(false); } };
  return <AuthLayout title="Create Account" subtitle="Choose an independent account method" backLink={{ label: 'Back to home', to: '/' }} signupPrompt={{ text: 'Already have an account? ', linkText: 'Login', to: '/login' }} extra={<><div className="divider">Or continue with</div><button type="button" className="google-btn" onClick={google}><GoogleIcon size={18} /> Continue with Google</button></>}>
    <div className={styles.socialRow}><Button appearance={mode === 'phone' ? 'primary' : 'outline'} onClick={() => setMode('phone')}>Phone + password</Button><Button appearance={mode === 'email' ? 'primary' : 'outline'} onClick={() => setMode('email')}>Email + OTP</Button></div>
    <div className={styles.inputGroup}><label className={styles.label}>Name</label><Input value={name} onChange={(_, data) => setName(data.value)} /></div>
    <div className={styles.inputGroup}><label className={styles.label}>{mode === 'phone' ? 'Phone number' : 'Email address'}</label><Input value={identifier} onChange={(_, data) => setIdentifier(data.value)} /></div>
    {!otpId ? <div className={styles.inputGroup}><label className={styles.label}>Password</label><Input type="password" value={password} onChange={(_, data) => setPassword(data.value)} /></div> : <div className={styles.inputGroup}><label className={styles.label}>Email verification code</label><Input value={code} onChange={(_, data) => setCode(data.value)} placeholder="000000" /></div>}
    <Button appearance="primary" disabled={loading} onClick={submit} style={{ width: '100%' }}>{otpId ? 'Verify and create account' : mode === 'email' ? 'Send email code' : 'Create account'}</Button>
  </AuthLayout>;
}

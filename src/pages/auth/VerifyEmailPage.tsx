import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@fluentui/react-components';
import { auth } from '../../lib/firebase';
import { sendEmailVerification, reload, signOut } from 'firebase/auth';
import { AuthLayout } from '../../components/common/Shared/Shared';
import { useAuthFormStyles } from './authStyles';

export function VerifyEmailPage() {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(false);
    const [resending, setResending] = useState(false);
    const s = useAuthFormStyles();
    const user = auth.currentUser;
    const email = user?.email ?? 'your email';

    const handleCheckVerified = async () => {
        if (!user) { navigate('/login'); return; }
        setChecking(true);
        try {
            await reload(user); // refresh user state from Firebase
            if (user.emailVerified) {
                toast.success('Email verified! You\'re all set.');
                navigate('/');
            } else {
                toast.error('Email not verified yet. Please check your inbox and click the link.');
            }
        } catch (e: any) {
            toast.error('Could not check verification status. Try again.');
        } finally {
            setChecking(false);
        }
    };

    const handleResend = async () => {
        if (!user) { navigate('/login'); return; }
        setResending(true);
        try {
            await sendEmailVerification(user);
            toast.success('Verification email resent! Check your inbox.');
        } catch (e: any) {
            const code: string = e?.code ?? '';
            if (code === 'auth/too-many-requests') {
                toast.error('Too many requests. Wait a minute before resending.');
            } else {
                toast.error('Failed to resend. Try again.');
            }
        } finally {
            setResending(false);
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
        navigate('/signup');
    };

    return (
        <AuthLayout
            title="Verify your email"
            subtitle={`We've sent a verification link to ${email}. Click the link in the email, then come back and press the button below.`}
            backLink={{ label: 'Back to home', to: '/' }}
            signupPrompt={{ text: 'Wrong email? ', linkText: 'Start over', to: '/signup' }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                <Button
                    appearance="primary"
                    disabled={checking}
                    onClick={handleCheckVerified}
                    style={{ width: '100%' }}
                >
                    {checking ? 'Checking…' : '✓ I verified my email'}
                </Button>

                <Button
                    appearance="outline"
                    disabled={resending}
                    onClick={handleResend}
                    style={{ width: '100%' }}
                >
                    {resending ? 'Sending…' : 'Resend verification email'}
                </Button>

                <button
                    type="button"
                    onClick={handleSignOut}
                    className={s.label}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '4px' }}
                >
                    Sign out and use a different email
                </button>
            </div>
        </AuthLayout>
    );
}

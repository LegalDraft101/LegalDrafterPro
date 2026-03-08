import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../../store/hooks';
import { fetchUser, setUser, setLoading } from '../../../store/slices/authSlice';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';

export function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Google and phone users have special sign-in methods -- don't
        // force them through email verification if they didn't use email/password.
        const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
        const isPhoneUser = user.providerData.some(p => p.providerId === 'phone');
        const needsEmailVerification = !user.emailVerified && !isGoogleUser && !isPhoneUser;
        const isSignupInProgress = !!(window as any).pendingSignupData
          || window.location.pathname.startsWith('/signup');

        if (needsEmailVerification && !isSignupInProgress) {
          dispatch(setUser(null));
          dispatch(setLoading(false));
          if (!window.location.pathname.startsWith('/verify-email')) {
            navigate('/verify-email');
          }
        } else {
          dispatch(fetchUser());
        }
      } else {
        dispatch(setUser(null));
        dispatch(setLoading(false));
      }
    });

    return () => unsub();
  }, [dispatch, navigate]);

  return <>{children}</>;
}

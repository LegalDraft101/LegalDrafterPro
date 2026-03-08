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
        if (!user.emailVerified) {
          // Account exists but email is not yet verified
          // Don't load their profile - treat them as logged out
          dispatch(setUser(null));
          dispatch(setLoading(false));
          // Redirect to verify-email page if not already there
          if (!window.location.pathname.startsWith('/verify-email')) {
            navigate('/verify-email');
          }
        } else {
          // Fully verified: sync with backend profile
          dispatch(fetchUser());
        }
      } else {
        // Logged out
        dispatch(setUser(null));
        dispatch(setLoading(false));
      }
    });

    return () => unsub();
  }, [dispatch, navigate]);

  return <>{children}</>;
}

import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser, setUser } from '../store/slices/authSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const loading = useAppSelector((state) => state.auth.loading);

  const logout = useCallback(async () => {
    const result = await dispatch(logoutUser());
    if (logoutUser.fulfilled.match(result)) {
      toast.success('Signed out.');
    }
    navigate('/', { replace: true });
  }, [dispatch, navigate]);

  const setUserAction = useCallback(
    (u: Parameters<typeof setUser>[0]) => {
      dispatch(setUser(u));
    },
    [dispatch]
  );

  return { user, loading, setUser: setUserAction, logout };
}

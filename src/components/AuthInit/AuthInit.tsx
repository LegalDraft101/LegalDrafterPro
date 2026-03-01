import { useEffect } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { fetchUser } from '../../store/slices/authSlice';

export function AuthInit({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

  return <>{children}</>;
}

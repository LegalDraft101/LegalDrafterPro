import { createContext, useContext, useState, useRef, useCallback } from 'react';

interface AuthModalContextValue {
  open: boolean;
  requireAuth: (onSuccess?: () => void) => void;
  closeModal: () => void;
  /** Called internally by the modal after successful authentication. */
  onAuthSuccess: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const onSuccessRef = useRef<(() => void) | undefined>();

  const requireAuth = useCallback((onSuccess?: () => void) => {
    onSuccessRef.current = onSuccess;
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setOpen(false);
    onSuccessRef.current = undefined;
  }, []);

  const onAuthSuccess = useCallback(() => {
    setOpen(false);
    const cb = onSuccessRef.current;
    onSuccessRef.current = undefined;
    if (cb) {
      // Small delay so Redux state has propagated before the callback runs
      setTimeout(cb, 50);
    }
  }, []);

  return (
    <AuthModalContext.Provider value={{ open, requireAuth, closeModal, onAuthSuccess }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used inside AuthModalProvider');
  return ctx;
}

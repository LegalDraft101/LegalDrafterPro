import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Button,
  Card,
  Title2,
  Spinner,
} from '@fluentui/react-components';
import { useAuth } from '../../hooks/useAuth';
import { usePageStyles } from './authStyles';

function maskPhone(phone: string): string {
  if (!phone || phone.length <= 4) return '****';
  return phone.slice(0, 2) + '****' + phone.slice(-2);
}

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, loading } = useAuth();
  const p = usePageStyles();

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in.');
      navigate('/login');
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className={p.accountWrapper}>
        <Card className={p.accountCard} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner label="Loading…" />
        </Card>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={p.accountWrapper}>
      <Card className={p.accountCard}>
        <Title2 className={p.accountHeading}>My Account</Title2>
        <dl className={p.accountDl}>
          <dt>Name</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Phone</dt>
          <dd>{maskPhone(user.phone) || '—'}</dd>
        </dl>
        <Button appearance="outline" onClick={() => logout()}>Logout</Button>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Button,
  Text,
} from '@fluentui/react-components';
import { NavigationRegular, DismissRegular } from '@fluentui/react-icons';
import { siteName } from '../../static/content';
import { useAuth } from '../../hooks/useAuth';

const useStyles = makeStyles({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderBottom: '1px solid rgba(255,255,255,0.3)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 24px',
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: 'inherit',
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#2b6cb0',
    color: '#fff',
    fontWeight: 800,
    fontSize: '14px',
  },
  brandName: {
    fontWeight: 800,
    fontSize: '18px',
    backgroundImage: 'linear-gradient(90deg, #2b6cb0, #4299e1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userLabel: {
    fontSize: '14px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  menuToggle: {
    display: 'none',
    '@media (max-width: 640px)': {
      display: 'inline-flex',
    },
  },
  desktopOnly: {
    '@media (max-width: 640px)': {
      display: 'none',
    },
  },
  mobileMenu: {
    display: 'none',
    '@media (max-width: 640px)': {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    },
  },
  mobileMenuHidden: {
    display: 'none',
  },
});

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const classes = useStyles();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  return (
    <header className={classes.header} role="banner">
      <nav className={classes.nav} aria-label="Main navigation">
        <Link to="/" className={classes.logo} aria-label={`${siteName} home`} onClick={closeMenu}>
          <span className={classes.logoIcon} aria-hidden>LD</span>
          <span className={classes.brandName}>{siteName}</span>
        </Link>
        <div className={classes.right}>
          {!loading && (
            <div className={classes.desktopOnly} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user ? (
                <>
                  <Text className={classes.userLabel}>{user.name}</Text>
                  <Button appearance="subtle" onClick={handleLogout} aria-label="Log out">
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button
                    appearance="primary"
                    aria-current={isLoginPage ? 'page' : undefined}
                  >
                    Login
                  </Button>
                </Link>
              )}
            </div>
          )}
          <div className={classes.menuToggle}>
            <Button
              appearance="transparent"
              icon={menuOpen ? <DismissRegular /> : <NavigationRegular />}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            />
          </div>
        </div>
      </nav>
      <div
        id="nav-menu"
        className={menuOpen ? classes.mobileMenu : classes.mobileMenuHidden}
        aria-hidden={!menuOpen}
      >
        {!loading && (
          user ? (
            <>
              <Text weight="semibold">{user.name}</Text>
              <Button appearance="subtle" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }} onClick={closeMenu}>
              <Button appearance="primary">Login</Button>
            </Link>
          )
        )}
      </div>
    </header>
  );
}

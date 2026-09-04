import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  makeStyles,
  shorthands,
  Button,
} from '@fluentui/react-components';
import {
  NavigationRegular,
  DismissRegular,
  GavelRegular,
  PersonRegular,
  SignOutRegular,
} from '@fluentui/react-icons';
import { siteName } from '../../../constants/content';
import { useAuth } from '../../../hooks/useAuth';

const useStyles = makeStyles({
  header: {
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    backgroundColor: 'rgba(10, 15, 30, 0.78)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25), 0 1px 0 rgba(255,255,255,0.04) inset',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shorthands.padding('14px', '32px'),
    maxWidth: '1400px',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
    color: 'inherit',
    transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    ':hover': {
      transform: 'scale(1.03)',
    },
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
    color: '#fff',
    fontWeight: '800',
    fontSize: '16px',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.35), 0 0 20px rgba(139, 92, 246, 0.15)',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden',
    '::after': {
      content: '""',
      position: 'absolute' as const,
      inset: '0',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%)',
      borderRadius: '12px',
    },
  },
  brandName: {
    fontWeight: '800',
    fontSize: '20px',
    letterSpacing: '-0.02em',
    backgroundImage: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 40%, #34d399 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundSize: '200% 200%',
    animationName: {
      '0%': { backgroundPosition: '0% 50%' },
      '50%': { backgroundPosition: '100% 50%' },
      '100%': { backgroundPosition: '0% 50%' },
    },
    animationDuration: '6s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
  },
  center: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    '@media (max-width: 640px)': {
      display: 'none',
    },
  },
  navLink: {
    textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: '14px',
    fontWeight: '500',
    ...shorthands.padding('8px', '16px'),
    borderRadius: '8px',
    transition: 'all 0.25s ease',
    position: 'relative' as const,
    ':hover': {
      color: '#fff',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
  },
  navLinkActive: {
    textDecoration: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    ...shorthands.padding('8px', '16px'),
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    boxShadow: '0 0 12px rgba(59, 130, 246, 0.1)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    ...shorthands.padding('6px', '14px', '6px', '10px'),
    borderRadius: '100px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.1)'),
    transition: 'all 0.25s ease',
    ':hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      ...shorthands.borderColor('rgba(255, 255, 255, 0.18)'),
    },
  },
  userAvatar: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '700',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  loginBtn: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6) !important',
    color: '#fff !important',
    fontWeight: '600 !important',
    ...shorthands.padding('8px', '22px'),
    borderRadius: '10px !important',
    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(139, 92, 246, 0.2) !important',
    ...shorthands.border('0', 'none', 'transparent'),
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(59, 130, 246, 0.45), 0 0 0 1px rgba(139, 92, 246, 0.35) !important',
    },
  },
  logoutBtn: {
    color: 'rgba(255, 255, 255, 0.6) !important',
    fontSize: '13px !important',
    fontWeight: '500 !important',
    ...shorthands.padding('6px', '12px'),
    borderRadius: '8px !important',
    transition: 'all 0.25s ease',
    ':hover': {
      color: '#f87171 !important',
      backgroundColor: 'rgba(248, 113, 113, 0.08) !important',
    },
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
      ...shorthands.padding('20px', '24px'),
      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
      backgroundColor: 'rgba(10, 15, 30, 0.95)',
      backdropFilter: 'blur(20px)',
      animationName: {
        from: { opacity: 0, transform: 'translateY(-8px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
      },
      animationDuration: '0.25s',
      animationTimingFunction: 'ease-out',
    },
  },
  mobileMenuHidden: {
    display: 'none',
  },
  menuIcon: {
    color: 'rgba(255, 255, 255, 0.7) !important',
    ':hover': {
      color: '#fff !important',
    },
  },
  // Subtle glow line under header
  glowLine: {
    height: '1px',
    background: 'linear-gradient(90deg, transparent 0%, #3b82f6 20%, #8b5cf6 50%, #06b6d4 80%, transparent 100%)',
    opacity: 0.5,
  },
});

export function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isHome = location.pathname === '/';
  const classes = useStyles();

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <header className={classes.header} role="banner">
      <nav className={classes.nav} aria-label="Main navigation">
        {/* Logo */}
        <Link to="/" className={classes.logo} aria-label={`${siteName} home`} onClick={closeMenu}>
          <span className={classes.logoIcon} aria-hidden>
            <GavelRegular fontSize={20} />
          </span>
          <span className={classes.brandName}>{siteName}</span>
        </Link>

        {/* Center nav links */}
        <div className={classes.center}>
          <Link to="/" className={isHome ? classes.navLinkActive : classes.navLink}>
            Home
          </Link>
          <Link to="/affidavit" className={location.pathname === '/affidavit' ? classes.navLinkActive : classes.navLink}>
            Affidavit
          </Link>
          <Link to="/rent-agreement" className={location.pathname === '/rent-agreement' ? classes.navLinkActive : classes.navLink}>
            Rent Agreement
          </Link>
        </div>

        {/* Right side */}
        <div className={classes.right}>
          {!loading && (
            <div className={classes.desktopOnly} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {user ? (
                <>
                  <div className={classes.userPill}>
                    <span className={classes.userAvatar}>{getInitials(user.name)}</span>
                    <span className={classes.userName}>{user.name}</span>
                  </div>
                  <Button
                    appearance="subtle"
                    className={classes.logoutBtn}
                    icon={<SignOutRegular />}
                    onClick={handleLogout}
                    aria-label="Log out"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button
                    className={classes.loginBtn}
                    appearance="primary"
                    icon={<PersonRegular />}
                    aria-current={isLoginPage ? 'page' : undefined}
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          )}
          <div className={classes.menuToggle}>
            <Button
              appearance="transparent"
              className={classes.menuIcon}
              icon={menuOpen ? <DismissRegular /> : <NavigationRegular />}
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="nav-menu"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            />
          </div>
        </div>
      </nav>

      {/* Glow line under header */}
      <div className={classes.glowLine} aria-hidden />

      {/* Mobile menu */}
      <div
        id="nav-menu"
        className={menuOpen ? classes.mobileMenu : classes.mobileMenuHidden}
        aria-hidden={!menuOpen}
      >
        <Link to="/" className={isHome ? classes.navLinkActive : classes.navLink} onClick={closeMenu}>
          Home
        </Link>
        <Link to="/affidavit" className={location.pathname === '/affidavit' ? classes.navLinkActive : classes.navLink} onClick={closeMenu}>
          Affidavit
        </Link>
        <Link to="/rent-agreement" className={location.pathname === '/rent-agreement' ? classes.navLinkActive : classes.navLink} onClick={closeMenu}>
          Rent Agreement
        </Link>
        {!loading && (
          user ? (
            <>
              <div className={classes.userPill}>
                <span className={classes.userAvatar}>{getInitials(user.name)}</span>
                <span className={classes.userName}>{user.name}</span>
              </div>
              <Button appearance="subtle" className={classes.logoutBtn} icon={<SignOutRegular />} onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link to="/login" style={{ textDecoration: 'none' }} onClick={closeMenu}>
              <Button className={classes.loginBtn} appearance="primary" icon={<PersonRegular />}>
                Sign In
              </Button>
            </Link>
          )
        )}
      </div>
    </header>
  );
}

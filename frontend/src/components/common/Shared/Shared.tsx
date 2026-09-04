import { Link } from 'react-router-dom';
import { siteName } from '../../../constants/content';
import '../../../pages/auth/Auth.scss';

export function GoogleIcon({ size = 20, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden>
      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// Sparkle Icon for the feature list
function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.8819 8.12595L21.3725 9.07096L16.6863 13.6341L17.7925 20.103L12 17.0607L6.20752 20.103L7.31375 13.6341L2.62749 9.07096L9.11812 8.12595L12 2Z" fill="currentColor" />
    </svg>
  );
}

// Shield Icon
function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Document Icon
function DocumentIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
  showPromo?: boolean;
  signupPrompt?: { text: string; linkText: string; to: string };
  extra?: React.ReactNode;
  backLink?: { label: string; to: string };
}

export function AuthLayout({
  children,
  title,
  subtitle,
  showPromo = true,
  signupPrompt,
  extra,
  backLink,
}: AuthLayoutProps) {
  return (
    <div className="auth-container">
      {showPromo && (
        <div className="auth-left">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>

          <div className="brand-content">
            <Link to="/" className="logo-container" aria-label={`${siteName} home`}>
              <span className="logo-icon" aria-hidden>LD</span>
              {siteName}
            </Link>

            <h1>AI-Powered Legal Drafting</h1>
            <p>Empower your legal practice with automated drafting, seamless document management, and intelligent insights.</p>

            <div className="feature-list">
              <div className="feature-item">
                <SparkleIcon />
                <span>Smart template generation tailored to your needs.</span>
              </div>
              <div className="feature-item">
                <ShieldIcon />
                <span>Enterprise-grade security and compliance.</span>
              </div>
              <div className="feature-item">
                <DocumentIcon />
                <span>Effortless collaboration and document tracking.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="auth-right">
        <div className="auth-card">
          <Link to="/" className="mobile-logo" aria-label={`${siteName} home`}>
            <span className="logo-icon" aria-hidden>LD</span>
            {siteName}
          </Link>

          {backLink && (
            <Link to={backLink.to} className="back-link" aria-label={backLink.label}>
              ← {backLink.label}
            </Link>
          )}

          <div className="auth-header">
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>

          <div className="form">
            {children}
            {extra}
          </div>

          {signupPrompt && (
            <div className="signup-text">
              {signupPrompt.text} <Link to={signupPrompt.to}>{signupPrompt.linkText}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


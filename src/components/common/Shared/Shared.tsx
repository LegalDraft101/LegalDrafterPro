import { Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Title2,
  Subtitle2,
} from '@fluentui/react-components';
import { siteName } from '../../../constants/content';

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

const useStyles = makeStyles({
  wrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  card: {
    display: 'flex',
    width: '100%',
    maxWidth: '960px',
    minHeight: '580px',
    overflow: 'hidden',
    borderRadius: '16px',
    boxShadow: tokens.shadow16,
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      minHeight: 'auto',
    },
  },
  promo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '48px 40px',
    backgroundImage: 'linear-gradient(135deg, #2b6cb0, #4299e1)',
    color: '#fff',
    '@media (max-width: 768px)': {
      padding: '32px 24px',
    },
  },
  promoTitle: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: 1.3,
    margin: '0 0 12px 0',
  },
  underline: {
    textDecoration: 'underline',
    textDecorationColor: 'rgba(255,255,255,0.5)',
    textUnderlineOffset: '4px',
  },
  promoSub: {
    fontSize: '14px',
    lineHeight: 1.6,
    opacity: 0.85,
    margin: 0,
  },
  formPanel: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '40px 36px',
    backgroundColor: tokens.colorNeutralBackground1,
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      padding: '28px 20px',
    },
  },
  backLink: {
    fontSize: '13px',
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    marginBottom: '20px',
    ':hover': { textDecoration: 'underline' },
  },
  logo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    color: 'inherit',
    marginBottom: '24px',
    fontWeight: 700,
    fontSize: '18px',
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#2b6cb0',
    color: '#fff',
    fontWeight: 800,
    fontSize: '12px',
  },
  heading: {
    margin: '0 0 4px 0',
  },
  subheading: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  signupPrompt: {
    fontSize: '13px',
    textAlign: 'center' as const,
    marginTop: '20px',
    color: tokens.colorNeutralForeground3,
    '& a': {
      color: tokens.colorBrandForegroundLink,
      fontWeight: 600,
      textDecoration: 'none',
    },
    '& a:hover': {
      textDecoration: 'underline',
    },
  },
});

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
  const classes = useStyles();

  return (
    <div className={classes.wrapper}>
      <Card className={classes.card}>
        {showPromo && (
          <div className={classes.promo}>
            <div>
              <h1 className={classes.promoTitle}>
                Simplify management with our <span className={classes.underline}>dashboard.</span>
              </h1>
              <p className={classes.promoSub}>
                Simplify your e-commerce management with our user-friendly admin dashboard.
              </p>
            </div>
          </div>
        )}
        <div className={classes.formPanel}>
          {backLink && (
            <Link to={backLink.to} className={classes.backLink} aria-label={backLink.label}>
              ← {backLink.label}
            </Link>
          )}
          <Link to="/" className={classes.logo} aria-label={`${siteName} home`}>
            <span className={classes.logoIcon} aria-hidden>LD</span>
            {siteName}
          </Link>
          <Title2 className={classes.heading}>{title}</Title2>
          <Subtitle2 className={classes.subheading}>{subtitle}</Subtitle2>
          <div className={classes.form}>
            {children}
            {extra}
          </div>
          {signupPrompt && (
            <Text className={classes.signupPrompt}>
              {signupPrompt.text} <Link to={signupPrompt.to}>{signupPrompt.linkText}</Link>
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
}

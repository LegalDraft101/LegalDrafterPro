import { Link } from 'react-router-dom';
import { makeStyles, shorthands, Text } from '@fluentui/react-components';
import {
  GavelRegular,
  MailRegular,
  ShieldCheckmarkRegular,
  DocumentTextRegular,
  ChatHelpRegular,
  ArrowUpRightRegular,
} from '@fluentui/react-icons';
import { footer as footerContent, siteName } from '../../../constants/content';

const useStyles = makeStyles({
  footer: {
    backgroundColor: 'rgba(8, 12, 24, 0.95)',
    backdropFilter: 'blur(20px)',
    marginTop: 'auto',
    position: 'relative' as const,
    overflow: 'hidden',
    '::before': {
      content: '""',
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      height: '1px',
      background: 'linear-gradient(90deg, transparent 0%, #3b82f6 20%, #8b5cf6 50%, #06b6d4 80%, transparent 100%)',
      opacity: 0.5,
    },
  },
  topSection: {
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...shorthands.padding('48px', '32px', '40px'),
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr',
    gap: '48px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '36px',
      ...shorthands.padding('36px', '24px', '28px'),
    },
  },
  brandBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
    position: 'relative' as const,
    overflow: 'hidden',
    '::after': {
      content: '""',
      position: 'absolute' as const,
      inset: '0',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 50%)',
      borderRadius: '10px',
    },
  },
  brandNameFooter: {
    fontWeight: '800',
    fontSize: '18px',
    backgroundImage: 'linear-gradient(135deg, #60a5fa, #a78bfa, #34d399)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  aboutText: {
    fontSize: '14px',
    lineHeight: '1.7',
    color: 'rgba(255, 255, 255, 0.45)',
    maxWidth: '300px',
    margin: 0,
  },
  socialRow: {
    display: 'flex',
    gap: '10px',
    marginTop: '4px',
  },
  socialBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    ...shorthands.border('1px', 'solid', 'rgba(255, 255, 255, 0.08)'),
    color: 'rgba(255, 255, 255, 0.45)',
    transition: 'all 0.25s ease',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      ...shorthands.borderColor('rgba(59, 130, 246, 0.3)'),
      color: '#60a5fa',
      transform: 'translateY(-2px)',
    },
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'rgba(255, 255, 255, 0.3)',
    marginBottom: '4px',
  },
  linkItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: '14px',
    fontWeight: '400',
    ...shorthands.padding('6px', '0'),
    transition: 'all 0.25s ease',
    ':hover': {
      color: '#60a5fa',
      transform: 'translateX(4px)',
    },
  },
  linkIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'rgba(255, 255, 255, 0.25)',
    fontSize: '16px',
    transition: 'color 0.25s ease',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    ...shorthands.padding('4px', '0'),
  },
  bottomBar: {
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    ...shorthands.padding('20px', '32px'),
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      gap: '12px',
      ...shorthands.padding('16px', '24px'),
    },
  },
  copyrightText: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.25)',
    margin: 0,
  },
  bottomLinks: {
    display: 'flex',
    gap: '20px',
  },
  bottomLink: {
    textDecoration: 'none',
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.3)',
    transition: 'color 0.25s ease',
    ':hover': {
      color: 'rgba(255, 255, 255, 0.7)',
    },
  },
  // Decorative orbs
  orbContainer: {
    position: 'absolute' as const,
    inset: 0,
    overflow: 'hidden',
    pointerEvents: 'none' as const,
  },
  orb1: {
    position: 'absolute' as const,
    bottom: '-60px',
    left: '-40px',
    width: '200px',
    height: '200px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
    filter: 'blur(40px)',
  },
  orb2: {
    position: 'absolute' as const,
    top: '-40px',
    right: '-20px',
    width: '180px',
    height: '180px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
    filter: 'blur(40px)',
  },
});

const linkIcons: Record<string, React.ReactNode> = {
  'Privacy Policy': <ShieldCheckmarkRegular />,
  'Terms of Service': <DocumentTextRegular />,
  'Contact': <MailRegular />,
  'Help': <ChatHelpRegular />,
};

export function Footer() {
  const classes = useStyles();

  return (
    <footer className={classes.footer} role="contentinfo">
      {/* Decorative orbs */}
      <div className={classes.orbContainer} aria-hidden>
        <div className={classes.orb1} />
        <div className={classes.orb2} />
      </div>

      {/* Main content */}
      <div className={classes.topSection}>
        {/* Brand column */}
        <div className={classes.brandBlock}>
          <div className={classes.brandRow}>
            <span className={classes.logoIcon} aria-hidden>
              <GavelRegular fontSize={18} />
            </span>
            <span className={classes.brandNameFooter}>{siteName}</span>
          </div>
          <Text className={classes.aboutText}>{footerContent.about}</Text>
          <div className={classes.socialRow}>
            <span className={classes.socialBtn} role="img" aria-label="Email">
              <MailRegular fontSize={16} />
            </span>
            <span className={classes.socialBtn} role="img" aria-label="Security">
              <ShieldCheckmarkRegular fontSize={16} />
            </span>
            <span className={classes.socialBtn} role="img" aria-label="Help">
              <ChatHelpRegular fontSize={16} />
            </span>
          </div>
        </div>

        {/* Quick Links column */}
        <div className={classes.block}>
          <div className={classes.sectionTitle}>Quick Links</div>
          {footerContent.links.map((link: { label: string; path: string }) => (
            <Link key={link.path} to={link.path} className={classes.linkItem}>
              <span className={classes.linkIcon}>
                {linkIcons[link.label] || <ArrowUpRightRegular />}
              </span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact column */}
        <div className={classes.block}>
          <div className={classes.sectionTitle}>{footerContent.contactLabel}</div>
          <div className={classes.contactItem}>
            <span className={classes.linkIcon}><MailRegular /></span>
            <span>support@legaldrafter.com</span>
          </div>
          <Text className={classes.aboutText} style={{ maxWidth: '240px' }}>
            Reach us via the contact form or support links. We're here to help with your drafting needs.
          </Text>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={classes.bottomBar}>
        <Text className={classes.copyrightText}>{footerContent.copyright}</Text>
        <div className={classes.bottomLinks}>
          <Link to="/privacy" className={classes.bottomLink}>Privacy</Link>
          <Link to="/terms" className={classes.bottomLink}>Terms</Link>
          <Link to="/contact" className={classes.bottomLink}>Contact</Link>
        </div>
      </div>
    </footer>
  );
}

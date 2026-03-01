import { makeStyles, tokens } from '@fluentui/react-components';

export const useAuthFormStyles = makeStyles({
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '12px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: tokens.colorNeutralForeground1,
  },
  fieldError: {
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 10px',
    borderRadius: '6px',
    backgroundColor: tokens.colorPaletteRedBackground1,
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
  },
  errorIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: tokens.colorPaletteRedForeground1,
    color: '#fff',
    fontWeight: 700,
    fontSize: '11px',
    flexShrink: 0,
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  visibilityBtn: {
    position: 'absolute',
    right: '4px',
  },
  forgotRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '16px',
  },
  forgotLink: {
    fontSize: '13px',
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    ':hover': { textDecoration: 'underline' },
  },
  submitRow: {
    marginTop: '8px',
    marginBottom: '8px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '13px',
    color: tokens.colorNeutralForeground4,
    margin: '12px 0',
  },
  socialRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  phoneRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  phonePrefix: {
    fontSize: '14px',
    fontWeight: 600,
    color: tokens.colorNeutralForeground3,
    padding: '0 4px',
  },
  otpChannelRow: {
    marginTop: '4px',
  },
  passwordFieldsError: {
    border: `1px solid ${tokens.colorPaletteRedBorder1}`,
    borderRadius: '8px',
    padding: '12px',
  },
});

export const usePageStyles = makeStyles({
  verifyWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  verifyCard: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px 32px',
    textAlign: 'center' as const,
    borderRadius: '16px',
    boxShadow: tokens.shadow16,
  },
  verifyHeading: {
    margin: '0 0 8px 0',
  },
  verifySubheading: {
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
    margin: '0 0 24px 0',
  },
  verifyForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    textAlign: 'left' as const,
  },
  verifyInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  verifyError: {
    fontSize: '12px',
    color: tokens.colorPaletteRedForeground1,
  },
  verifyBackLinks: {
    marginTop: '20px',
    fontSize: '13px',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
    color: tokens.colorNeutralForeground4,
  },
  verifyBackLink: {
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    ':hover': { textDecoration: 'underline' },
  },
  accountWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  accountCard: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px 32px',
    borderRadius: '16px',
    boxShadow: tokens.shadow16,
  },
  accountHeading: {
    margin: '0 0 24px 0',
  },
  accountDl: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    gap: '8px 20px',
    fontSize: '14px',
    marginBottom: '24px',
    '& dt': { fontWeight: 600, color: tokens.colorNeutralForeground3 },
    '& dd': { margin: 0, color: tokens.colorNeutralForeground1 },
  },
});

export const INDIA_PREFIX = '+91';

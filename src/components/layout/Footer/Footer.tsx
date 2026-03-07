import { Link } from 'react-router-dom';
import { makeStyles, tokens, Text } from '@fluentui/react-components';
import { footer as footerContent } from '../../../constants/content';

const useStyles = makeStyles({
  footer: {
    backgroundColor: tokens.colorNeutralBackground3,
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    padding: '40px 24px 24px',
    marginTop: 'auto',
  },
  inner: {
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '32px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
    },
  },
  block: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: tokens.colorNeutralForeground1,
    margin: 0,
  },
  about: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground3,
    margin: 0,
  },
  contact: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: tokens.colorNeutralForeground3,
    margin: 0,
  },
  links: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  link: {
    fontSize: '13px',
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  },
  copyright: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    paddingTop: '24px',
    borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
    fontSize: '12px',
    color: tokens.colorNeutralForeground4,
  },
});

export function Footer() {
  const classes = useStyles();

  return (
    <footer className={classes.footer} role="contentinfo">
      <div className={classes.inner}>
        <div className={classes.block}>
          <h3 className={classes.title}>About</h3>
          <Text className={classes.about}>{footerContent.about}</Text>
        </div>
        <div className={classes.block}>
          <h3 className={classes.title}>{footerContent.contactLabel}</h3>
          <Text className={classes.contact}>Reach us via the contact form or support links below.</Text>
        </div>
        <div className={classes.links}>
          {footerContent.links.map((link: { label: string; path: string }) => (
            <Link key={link.path} to={link.path} className={classes.link}>{link.label}</Link>
          ))}
        </div>
        <div className={classes.copyright}>{footerContent.copyright}</div>
      </div>
    </footer>
  );
}

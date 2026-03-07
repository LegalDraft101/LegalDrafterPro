import { Link } from 'react-router-dom';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  backLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '14px',
    color: tokens.colorBrandForegroundLink,
    textDecoration: 'none',
    marginTop: '24px',
    ':hover': {
      textDecoration: 'underline',
    },
  },
});

interface BackLinkProps {
  to: string;
  children: React.ReactNode;
  className?: string;
}

export function BackLink({ to, children, className = '' }: BackLinkProps) {
  const classes = useStyles();
  return (
    <Link to={to} className={`${classes.backLink} ${className}`.trim()}>
      {children}
    </Link>
  );
}

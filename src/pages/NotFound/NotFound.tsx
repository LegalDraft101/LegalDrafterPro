import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Title1,
  Text,
  Button,
} from '@fluentui/react-components';
import { PageLayout } from '../../components/common/PageLayout/PageLayout';
import { siteName } from '../../constants/content';

const useStyles = makeStyles({
  page: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  },
  content: {
    textAlign: 'center' as const,
    maxWidth: '420px',
  },
  code: {
    fontSize: '96px',
    fontWeight: 800,
    backgroundImage: 'linear-gradient(135deg, #2b6cb0, #4299e1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
    lineHeight: 1,
  },
  title: {
    marginBottom: '12px',
  },
  text: {
    color: tokens.colorNeutralForeground3,
    fontSize: '15px',
    marginBottom: '28px',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
});

export function NotFoundPage() {
  const classes = useStyles();

  useEffect(() => {
    const prev = document.title;
    document.title = `Page not found — ${siteName}`;
    return () => { document.title = prev; };
  }, []);

  return (
    <PageLayout skipLinkTarget="main-content" constrained className={classes.page}>
      <div className={classes.content}>
        <p className={classes.code} aria-hidden>404</p>
        <Title1 className={classes.title}>Page not found</Title1>
        <Text className={classes.text}>
          The page you're looking for doesn't exist or may have been moved.
        </Text>
        <div className={classes.actions}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <Button appearance="primary">Back to home</Button>
          </Link>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button appearance="outline">Go to Login</Button>
          </Link>
        </div>
      </div>
    </PageLayout>
  );
}

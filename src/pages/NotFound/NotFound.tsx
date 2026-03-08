import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@fluentui/react-components';
import { siteName } from '../../constants/content';
import '../../styles/inner-page.scss';

export function NotFoundPage() {
  useEffect(() => {
    const prev = document.title;
    document.title = `Page not found — ${siteName}`;
    return () => { document.title = prev; };
  }, []);

  return (
    <main className="inner-page inner-page--centered">
      <p className="inner-page__404-code" aria-hidden>404</p>
      <h1 className="inner-page__title" style={{ marginTop: '0.5rem' }}>Page not found</h1>
      <p className="inner-page__subtitle">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <div className="inner-page__actions">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button appearance="primary">Back to home</Button>
        </Link>
      </div>
    </main>
  );
}

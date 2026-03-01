import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
  },
  skipLink: {
    position: 'absolute',
    top: '-40px',
    left: '0',
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    padding: '8px 16px',
    zIndex: 100,
    ':focus': {
      top: '0',
    },
  },
  main: {
    flex: 1,
  },
  mainConstrained: {
    flex: 1,
    maxWidth: '1200px',
    marginLeft: 'auto',
    marginRight: 'auto',
    width: '100%',
    paddingLeft: '24px',
    paddingRight: '24px',
    paddingTop: '32px',
    paddingBottom: '32px',
  },
});

interface PageLayoutProps {
  children: React.ReactNode;
  skipLinkTarget?: string;
  skipLinkLabel?: string;
  className?: string;
  constrained?: boolean;
}

export function PageLayout({
  children,
  skipLinkTarget,
  skipLinkLabel = 'Skip to main content',
  className = '',
  constrained = true,
}: PageLayoutProps) {
  const classes = useStyles();

  return (
    <div className={`${classes.page} ${className}`.trim()}>
      {skipLinkTarget && (
        <a href={`#${skipLinkTarget}`} className={classes.skipLink}>
          {skipLinkLabel}
        </a>
      )}
      <main
        className={constrained ? classes.mainConstrained : classes.main}
        id={skipLinkTarget ?? undefined}
        role="main"
      >
        {children}
      </main>
    </div>
  );
}

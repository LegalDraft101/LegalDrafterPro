import {
  makeStyles,
  tokens,
  Card,
  Text,
  Subtitle2,
} from '@fluentui/react-components';

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '20px',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'transform, box-shadow',
    textAlign: 'left' as const,
    width: '100%',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  name: {
    fontWeight: 600,
  },
  description: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
  },
});

interface TypeCardProps {
  name: string;
  description: string;
  onClick: () => void;
  ariaLabel?: string;
}

export function TypeCard({ name, description, onClick, ariaLabel }: TypeCardProps) {
  const classes = useStyles();

  return (
    <Card className={classes.card} onClick={onClick} aria-label={ariaLabel ?? `Select ${name}`}>
      <Subtitle2 className={classes.name}>{name}</Subtitle2>
      <Text className={classes.description}>{description}</Text>
    </Card>
  );
}

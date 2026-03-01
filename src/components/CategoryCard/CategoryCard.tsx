import { Link } from 'react-router-dom';
import {
  makeStyles,
  tokens,
  Card,
  Text,
  Subtitle1,
} from '@fluentui/react-components';
import type { DraftingCategory } from '../../static/content';

const useStyles = makeStyles({
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: '28px 24px',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer',
    transitionDuration: '0.2s',
    transitionProperty: 'transform, box-shadow',
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: tokens.shadow16,
    },
  },
  icon: {
    fontSize: '32px',
    marginBottom: '12px',
  },
  title: {
    marginBottom: '8px',
    fontWeight: 600,
  },
  description: {
    fontSize: '13px',
    color: tokens.colorNeutralForeground3,
    lineHeight: '1.5',
    marginBottom: '16px',
    flex: 1,
  },
  cta: {
    fontSize: '13px',
    fontWeight: 600,
    color: tokens.colorBrandForegroundLink,
  },
});

interface CategoryCardProps {
  category: DraftingCategory;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const classes = useStyles();

  return (
    <Link to={category.path} style={{ textDecoration: 'none' }} aria-label={`Start ${category.name}`}>
      <Card className={classes.card}>
        {category.icon && (
          <span className={classes.icon} aria-hidden>
            {category.icon}
          </span>
        )}
        <Subtitle1 className={classes.title}>{category.name}</Subtitle1>
        <Text className={classes.description}>{category.description}</Text>
        <Text className={classes.cta}>Start drafting →</Text>
      </Card>
    </Link>
  );
}

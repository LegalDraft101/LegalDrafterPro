import { makeStyles, Spinner, Text } from '@fluentui/react-components';
import type { DraftType } from '../../api/index';
import { TypeCard } from '../TypeCard/TypeCard';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '16px',
    marginTop: '16px',
  },
  loading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '48px 0',
  },
});

interface TypeCardGridProps {
  types: DraftType[];
  onSelect: (typeId: string) => void;
  loading?: boolean;
}

export function TypeCardGrid({ types, onSelect, loading }: TypeCardGridProps) {
  const classes = useStyles();

  if (loading) {
    return (
      <div className={classes.loading}>
        <Spinner size="small" />
        <Text>Loading...</Text>
      </div>
    );
  }

  return (
    <div className={classes.grid} role="list">
      {types.map((t) => (
        <div key={t.id} role="listitem">
          <TypeCard
            name={t.name}
            description={t.description}
            onClick={() => onSelect(t.id)}
            ariaLabel={`Select ${t.name}`}
          />
        </div>
      ))}
    </div>
  );
}

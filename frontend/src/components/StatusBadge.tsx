type BadgeTone = 'waiting' | 'called' | 'done' | 'stock-ok' | 'stock-low' | 'stock-out';

const labels: Record<BadgeTone, string> = {
  waiting: 'Waiting',
  called: 'Called',
  done: 'Done',
  'stock-ok': 'In Stock',
  'stock-low': 'Low Stock',
  'stock-out': 'Out Of Stock',
};

export const StatusBadge = ({ tone }: { tone: BadgeTone }) => (
  <span className={`badge badge-${tone}`}>{labels[tone]}</span>
);

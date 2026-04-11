export type NodeStatus = 'hidden' | 'correct' | 'wrong' | 'default';

const STATUS_COLORS: Record<NodeStatus, string> = {
  hidden: '#444444',
  correct: '#4CAF50',
  wrong: '#F44336',
  default: '#E0E0E0',
};

export default function MapNode({ id, d, status }: { id: string; d: string; status: NodeStatus }) {
  return (
    <path
      id={id}
      d={d}
      fill={STATUS_COLORS[status]}
      stroke="#FFFFFF"
      strokeWidth={0.5}
    />
  );
}

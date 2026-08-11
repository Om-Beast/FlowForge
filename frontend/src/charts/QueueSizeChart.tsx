import type { FC } from 'react';

interface QueueSizeChartProps {
  data?: Array<{ queue: string; size: number }>;
}

const QueueSizeChart: FC<QueueSizeChartProps> = () => {
  // TODO: Implement with Recharts BarChart
  return <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Queue Size Chart</p></div>;
};

export default QueueSizeChart;

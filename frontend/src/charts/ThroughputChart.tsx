import type { FC } from 'react';

interface ThroughputChartProps {
  data?: Array<{ timestamp: string; value: number }>;
}

const ThroughputChart: FC<ThroughputChartProps> = () => {
  // TODO: Implement with Recharts AreaChart
  return <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Throughput Chart</p></div>;
};

export default ThroughputChart;

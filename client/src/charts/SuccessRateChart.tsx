import type { FC } from 'react';

interface SuccessRateChartProps {
  successRate?: number;
  failureRate?: number;
}

const SuccessRateChart: FC<SuccessRateChartProps> = () => {
  // TODO: Implement with Recharts PieChart
  return <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Success Rate Chart</p></div>;
};

export default SuccessRateChart;

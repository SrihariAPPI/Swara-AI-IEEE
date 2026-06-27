import { motion } from "motion/react";

interface VerdictDistributionChartProps {
  distribution: Record<string, number>;
}

const VERDICT_COLORS: Record<string, string> = {
  TRUE: '#22c55e',
  FALSE: '#ef4444',
  MISLEADING: '#eab308',
  PARTIALLY_TRUE: '#f97316',
  INSUFFICIENT_EVIDENCE: '#6b7280',
};

const VERDICT_LABELS: Record<string, string> = {
  TRUE: 'True',
  FALSE: 'False',
  MISLEADING: 'Misleading',
  PARTIALLY_TRUE: 'Partially True',
  INSUFFICIENT_EVIDENCE: 'Insufficient',
};

export default function VerdictDistributionChart({ distribution }: VerdictDistributionChartProps) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <div className="text-center py-6 text-cream/30 text-sm">No verification data yet</div>;
  }

  return (
    <div className="space-y-3">
      {Object.entries(distribution).map(([key, count]) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;
        const color = VERDICT_COLORS[key] || '#6b7280';
        const label = VERDICT_LABELS[key] || key;

        return (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-cream/70">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cream/50">{count}</span>
                <span className="text-cream/30 w-8 text-right">{percentage.toFixed(0)}%</span>
              </div>
            </div>
            <div className="h-2 bg-cream/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

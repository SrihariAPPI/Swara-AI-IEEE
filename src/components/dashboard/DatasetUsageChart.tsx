import { motion } from "motion/react";

interface DatasetUsageChartProps {
  usage: Record<string, number>;
}

const DS_COLORS = ['#FF9F1C', '#E76F51', '#F4A261', '#264653', '#2a9d8f'];

export default function DatasetUsageChart({ usage }: DatasetUsageChartProps) {
  const entries = Object.entries(usage).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, c]) => a + c, 0);

  if (total === 0) {
    return <div className="text-center py-6 text-cream/30 text-sm">No dataset usage data</div>;
  }

  return (
    <div className="space-y-3">
      {entries.map(([name, count], i) => {
        const percentage = (count / total) * 100;
        const color = DS_COLORS[i % DS_COLORS.length];
        const shortName = name.length > 20 ? name.slice(0, 20) + '...' : name;

        return (
          <div key={name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cream/70 truncate max-w-[180px]">{shortName}</span>
              <span className="text-cream/50">{count} uses</span>
            </div>
            <div className="h-2 bg-cream/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: "easeOut" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

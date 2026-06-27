import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: string;
  trend?: { value: number; positive: boolean };
}

export default function StatsCard({ title, value, subtitle, icon: Icon, color, trend }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl p-4 border border-cream/5 hover:border-marigold/20 transition-all"
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-cream/40 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-cream">{value}</p>
          {subtitle && <p className="text-[10px] text-cream/30">{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={18} className={color} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-3 pt-3 border-t border-cream/5">
          <span className={`text-xs ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-[10px] text-cream/30">vs last week</span>
        </div>
      )}
    </motion.div>
  );
}

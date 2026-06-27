import { motion } from "motion/react";

interface ConfidenceMeterProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ConfidenceMeter({ value, size = 'md', showLabel = true }: ConfidenceMeterProps) {
  const dimensions = { sm: 80, md: 120, lg: 160 }[size];
  const strokeWidth = { sm: 6, md: 8, lg: 10 }[size];
  const radius = (dimensions - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const getColor = (v: number) => {
    if (v >= 80) return '#22c55e';
    if (v >= 60) return '#eab308';
    if (v >= 40) return '#f97316';
    return '#ef4444';
  };

  const getLabel = (v: number) => {
    if (v >= 80) return 'High Confidence';
    if (v >= 60) return 'Moderate Confidence';
    if (v >= 40) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  const color = getColor(value);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={dimensions} height={dimensions} className="-rotate-90">
        <circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={dimensions / 2}
          cy={dimensions / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-cream font-bold"
          transform={`rotate(90, ${dimensions / 2}, ${dimensions / 2})`}
          fontSize={size === 'sm' ? 18 : size === 'md' ? 28 : 36}
        >
          {value}%
        </text>
      </svg>
      {showLabel && (
        <span className="text-[10px] uppercase tracking-wider text-cream/50">{getLabel(value)}</span>
      )}
    </div>
  );
}

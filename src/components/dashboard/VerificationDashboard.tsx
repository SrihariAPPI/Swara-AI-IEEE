import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  X, ShieldCheck, Activity, Database, Clock,
  TrendingUp, BarChart3, PieChart
} from "lucide-react";
import StatsCard from "./StatsCard";
import VerdictDistributionChart from "./VerdictDistributionChart";
import DatasetUsageChart from "./DatasetUsageChart";
import HistoryTable from "./HistoryTable";
import { getAnalyticsSummary, getConfidenceDistribution, type VerificationResult } from "../../services/verificationService";

interface VerificationDashboardProps {
  onClose: () => void;
  onViewResult: (result: VerificationResult) => void;
}

export default function VerificationDashboard({ onClose, onViewResult }: VerificationDashboardProps) {
  const [summary, setSummary] = useState<any>(null);
  const [confDist, setConfDist] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [s, c] = await Promise.all([
        getAnalyticsSummary(),
        getConfidenceDistribution(),
      ]);
      setSummary(s);
      setConfDist(c);
    } catch {
      // Silent fail
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-16 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="glass rounded-3xl w-full max-w-3xl p-6 relative shadow-2xl border border-marigold/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-cream/10 transition-colors">
          <X size={18} className="text-cream/50" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-marigold/10 flex items-center justify-center border border-marigold/30">
            <Activity className="text-marigold" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-marigold">Verification Dashboard</h2>
            <p className="text-sm text-cream/50">Analytics and history</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['overview', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === tab
                  ? 'bg-marigold/20 border border-marigold/40 text-marigold'
                  : 'bg-cream/5 border border-cream/5 text-cream/50 hover:bg-cream/10'
              }`}
            >
              {tab === 'overview' ? 'Overview' : 'History'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard
                title="Total Verifications"
                value={summary?.totalVerifications || 0}
                icon={ShieldCheck}
                color="text-marigold"
              />
              <StatsCard
                title="Avg Confidence"
                value={`${summary?.averageConfidence || 0}%`}
                icon={TrendingUp}
                color="text-green-400"
              />
              <StatsCard
                title="Datasets Used"
                value={Object.keys(summary?.datasetUsage || {}).length || 0}
                icon={Database}
                color="text-sky-400"
              />
              <StatsCard
                title="Avg Latency"
                value={`${((summary?.averageLatencyMs || 0) / 1000).toFixed(1)}s`}
                icon={Clock}
                color="text-purple-400"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass rounded-xl p-4 border border-cream/5">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart size={14} className="text-marigold" />
                  <h3 className="text-xs font-semibold text-cream/60 uppercase tracking-wider">Verdict Distribution</h3>
                </div>
                <VerdictDistributionChart distribution={summary?.verdictDistribution || {}} />
              </div>

              <div className="glass rounded-xl p-4 border border-cream/5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={14} className="text-marigold" />
                  <h3 className="text-xs font-semibold text-cream/60 uppercase tracking-wider">Dataset Usage</h3>
                </div>
                <DatasetUsageChart usage={summary?.datasetUsage || {}} />
              </div>
            </div>

            {/* Confidence Distribution */}
            {confDist && (
              <div className="glass rounded-xl p-4 border border-cream/5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 size={14} className="text-marigold" />
                  <h3 className="text-xs font-semibold text-cream/60 uppercase tracking-wider">Confidence Distribution</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {confDist.buckets.map((bucket: any) => (
                    <div key={bucket.range} className="text-center">
                      <div className="h-20 bg-cream/5 rounded-lg overflow-hidden relative flex items-end">
                        <motion.div
                          className="w-full bg-gradient-to-t from-marigold to-terracotta rounded-b-lg"
                          initial={{ height: 0 }}
                          animate={{ height: `${(bucket.count / Math.max(...confDist.buckets.map((b: any) => b.count))) * 100}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                      <p className="text-[10px] text-cream/40 mt-1">{bucket.range}</p>
                      <p className="text-[10px] text-cream/60 font-medium">{bucket.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[10px] text-cream/20 text-center">
              Powered by IEEE DataPort datasets: FN-NLI | RW-Post | NFFN
            </p>
          </div>
        )}

        {activeTab === 'history' && (
          <HistoryTable onSelectResult={onViewResult} />
        )}
      </motion.div>
    </motion.div>
  );
}

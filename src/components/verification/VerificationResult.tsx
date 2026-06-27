import { motion } from "motion/react";
import {
  ShieldCheck, ShieldX, AlertTriangle, HelpCircle,
  Clock, Database, Layers, X, Download, FileText, Sparkles
} from "lucide-react";
import ConfidenceMeter from "./ConfidenceMeter";
import EvidenceViewer from "./EvidenceViewer";
import ReasoningTimeline from "./ReasoningTimeline";
import CitationDisplay from "./CitationDisplay";
import type { VerificationResult as VR } from "../../services/verificationService";

interface VerificationResultProps {
  result: VR;
  onClose: () => void;
}

const VERDICT_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  TRUE: { label: 'True', icon: ShieldCheck, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  FALSE: { label: 'False', icon: ShieldX, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  MISLEADING: { label: 'Misleading', icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
  PARTIALLY_TRUE: { label: 'Partially True', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
  INSUFFICIENT_EVIDENCE: { label: 'Insufficient Evidence', icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' },
};

export default function VerificationResult({ result, onClose }: VerificationResultProps) {
  const verdict = VERDICT_CONFIG[result.verdict.label] || VERDICT_CONFIG.INSUFFICIENT_EVIDENCE;
  const VerdictIcon = verdict.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-start justify-center p-4 pt-16 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="glass rounded-3xl w-full max-w-2xl p-6 relative shadow-2xl border border-marigold/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-cream/10 transition-colors">
          <X size={18} className="text-cream/50" />
        </button>

        {/* Verdict Badge */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`p-3 rounded-2xl ${verdict.bg}`}>
            <VerdictIcon size={28} className={verdict.color} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-serif font-bold text-cream">Verification Result</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${verdict.bg} ${verdict.color}`}>
                {verdict.label}
              </span>
            </div>
            <p className="text-sm text-cream/50 mt-0.5">
              {result.input.type === 'url' ? 'URL Analysis' : 'Content Analysis'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <ConfidenceMeter value={result.verdict.confidence} size="md" />
          <div className="space-y-2">
            <div className="glass rounded-xl p-3 border border-cream/5">
              <div className="flex items-center gap-2 text-xs text-cream/40 mb-1">
                <Database size={12} />
                Datasets Searched
              </div>
              <span className="text-lg font-bold text-cream">{result.metrics.datasetsSearched}</span>
            </div>
            <div className="glass rounded-xl p-3 border border-cream/5">
              <div className="flex items-center gap-2 text-xs text-cream/40 mb-1">
                <Layers size={12} />
                Evidence Items
              </div>
              <span className="text-lg font-bold text-cream">{result.metrics.evidenceCount}</span>
            </div>
            <div className="glass rounded-xl p-3 border border-cream/5">
              <div className="flex items-center gap-2 text-xs text-cream/40 mb-1">
                <Clock size={12} />
                Processing Time
              </div>
              <span className="text-lg font-bold text-cream">{(result.metrics.latencyMs / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Claims */}
        {result.claims.length > 0 && (
          <div className="mb-6">
            <h4 className="text-xs font-semibold text-cream/40 uppercase tracking-widest mb-2">Claims Analyzed</h4>
            <div className="flex flex-wrap gap-2">
              {result.claims.map((claim) => (
                <div key={claim.id} className="glass rounded-lg px-3 py-2 border border-cream/5">
                  <p className="text-xs text-cream/80">{claim.text}</p>
                  <span className="text-[10px] text-cream/30 capitalize">{claim.domain}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        <div className="mb-6">
          <EvidenceViewer evidence={result.evidenceUsed} />
        </div>

        {/* Reasoning */}
        <div className="mb-6">
          <ReasoningTimeline
            steps={result.reasoning.steps}
            alternativeInterpretation={result.reasoning.alternativeInterpretation}
            crossVerification={result.reasoning.crossVerification}
          />
        </div>

        {/* Citations */}
        <div className="mb-6">
          <CitationDisplay citations={result.citations} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-cream/10">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream/5 border border-cream/10 text-cream/60 text-sm hover:bg-cream/10 transition-colors">
            <Download size={14} />
            Export Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream/5 border border-cream/10 text-cream/60 text-sm hover:bg-cream/10 transition-colors">
            <FileText size={14} />
            View Raw Data
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-marigold/10 border border-marigold/20 text-marigold text-sm hover:bg-marigold/20 transition-colors ml-auto">
            <Sparkles size={14} />
            Share Result
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

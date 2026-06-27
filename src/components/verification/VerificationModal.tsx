import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2, FileSearch, Brain, Database, Scale, BarChart, Sparkles } from "lucide-react";
import InputPanel from "./InputPanel";
import VerificationResult from "./VerificationResult";
import {
  submitVerification,
  getVerificationResult,
  streamVerificationProgress,
  type VerificationResult as VR,
} from "../../services/verificationService";

interface VerificationModalProps {
  onClose: () => void;
}

type StepStatus = 'pending' | 'active' | 'complete' | 'error';
interface PipelineStep {
  agent: string;
  label: string;
  icon: any;
  status: StepStatus;
  message: string;
}

const PIPELINE_STEPS: PipelineStep[] = [
  { agent: 'input', label: 'Input Processing', icon: FileSearch, status: 'pending', message: '' },
  { agent: 'claim_extraction', label: 'Claim Extraction', icon: Brain, status: 'pending', message: '' },
  { agent: 'evidence_retrieval', label: 'Evidence Retrieval', icon: Database, status: 'pending', message: '' },
  { agent: 'reasoning', label: 'AI Reasoning', icon: Scale, status: 'pending', message: '' },
  { agent: 'verification', label: 'Cross Verification', icon: Scale, status: 'pending', message: '' },
  { agent: 'confidence_scoring', label: 'Confidence Scoring', icon: BarChart, status: 'pending', message: '' },
  { agent: 'report_generation', label: 'Report Generation', icon: Sparkles, status: 'pending', message: '' },
];

export default function VerificationModal({ onClose }: VerificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<PipelineStep[]>(PIPELINE_STEPS);
  const [result, setResult] = useState<VR | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = useCallback(async (type: 'text' | 'url' | 'pdf' | 'image', content: string, name?: string) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);
    setSteps(PIPELINE_STEPS.map(s => ({ ...s, status: 'pending' as StepStatus })));

    try {
      const { jobId } = await submitVerification({ type, content, originalName: name });

      const cleanup = streamVerificationProgress(
        jobId,
        (progress) => {
          setSteps(prev => prev.map(s => {
            if (s.agent === progress.agent) {
              return { ...s, status: progress.status === 'complete' ? 'complete' as StepStatus : 'active' as StepStatus, message: progress.message };
            }
            if (s.status === 'active' && s.agent !== progress.agent) {
              return { ...s, status: 'complete' as StepStatus };
            }
            return s;
          }));
        },
        (finalResult) => {
          setResult(finalResult);
          setIsProcessing(false);
          setSteps(prev => prev.map(s => ({ ...s, status: 'complete' as StepStatus })));
        },
        (err) => {
          setError(err.message);
          setIsProcessing(false);
          setSteps(prev => prev.map(s => s.status === 'active' ? { ...s, status: 'error' as StepStatus } : s));
        }
      );
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setIsProcessing(false);
    }
  }, []);

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
        className="glass rounded-3xl w-full max-w-xl p-6 relative shadow-2xl border border-marigold/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full hover:bg-cream/10 transition-colors">
          <X size={18} className="text-cream/50" />
        </button>

        <h2 className="text-xl font-serif font-bold text-marigold mb-1">Information Verification</h2>
        <p className="text-sm text-cream/50 mb-6">
          Verify claims against IEEE DataPort datasets using AI-powered analysis
        </p>

        {!result && !isProcessing && !error && (
          <InputPanel onVerify={handleVerify} isProcessing={isProcessing} />
        )}

        {/* Pipeline Progress */}
        {isProcessing && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-cream/40 uppercase tracking-widest mb-4">Verification Pipeline</h3>
            {steps.map((step, i) => (
              <div key={step.agent} className="flex items-center gap-3">
                <div className={`p-1.5 rounded-full transition-all ${
                  step.status === 'complete' ? 'bg-green-500/10 text-green-400' :
                  step.status === 'active' ? 'bg-marigold/10 text-marigold' :
                  step.status === 'error' ? 'bg-red-500/10 text-red-400' :
                  'bg-cream/5 text-cream/20'
                }`}>
                  {step.status === 'complete' ? <CheckCircle2 size={14} /> :
                   step.status === 'active' ? <Loader2 size={14} className="animate-spin" /> :
                   <step.icon size={14} />}
                </div>
                <div className="flex-1">
                  <p className={`text-xs font-medium ${step.status === 'complete' ? 'text-cream/70' :
                    step.status === 'active' ? 'text-cream' : 'text-cream/30'}`}>
                    {step.label}
                  </p>
                  {step.message && (
                    <p className="text-[10px] text-cream/40 mt-0.5">{step.message}</p>
                  )}
                </div>
                {step.status === 'complete' && (
                  <span className="text-[10px] text-green-400/60">Done</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && !isProcessing && (
            <VerificationResult result={result} onClose={onClose} />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

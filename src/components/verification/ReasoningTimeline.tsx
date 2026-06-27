import { motion } from "motion/react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";

interface ReasoningStep {
  step: number;
  description: string;
  detail: string;
  confidence: number;
}

interface ReasoningTimelineProps {
  steps: ReasoningStep[];
  alternativeInterpretation: string | null;
  crossVerification: string;
}

export default function ReasoningTimeline({ steps, alternativeInterpretation, crossVerification }: ReasoningTimelineProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-cream/40 uppercase tracking-widest mb-3">
        Reasoning Timeline
      </h4>

      {steps.map((step, i) => (
        <motion.div
          key={step.step}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex gap-3"
        >
          <div className="flex flex-col items-center">
            <div className={`p-1.5 rounded-full ${
              step.confidence > 70 ? 'bg-green-500/10 text-green-400' :
              step.confidence > 40 ? 'bg-yellow-500/10 text-yellow-400' :
              'bg-red-500/10 text-red-400'
            }`}>
              {step.confidence > 70 ? <CheckCircle2 size={14} /> : <Circle size={14} />}
            </div>
            {i < steps.length - 1 && <div className="w-px flex-1 bg-cream/5 my-1" />}
          </div>
          <div className="flex-1 pb-4">
            <div className="glass rounded-xl p-3 border border-cream/5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-cream/80">
                  Step {step.step}: {step.description}
                </span>
                <span className="text-[10px] text-cream/40">
                  {(step.confidence)}% confidence
                </span>
              </div>
              <p className="text-xs text-cream/50 leading-relaxed">{step.detail}</p>
            </div>
          </div>
        </motion.div>
      ))}

      {/* Cross Verification */}
      <div className="flex gap-3">
        <div className="flex flex-col items-center">
          <div className="p-1.5 rounded-full bg-marigold/10 text-marigold">
            <ArrowRight size={14} />
          </div>
        </div>
        <div className="flex-1">
          <div className="glass rounded-xl p-3 border border-marigold/10">
            <span className="text-xs font-semibold text-marigold/80 mb-1 block">
              Cross-Verification
            </span>
            <p className="text-xs text-cream/50">{crossVerification}</p>
          </div>
        </div>
      </div>

      {/* Alternative Interpretation */}
      {alternativeInterpretation && (
        <div className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="p-1.5 rounded-full bg-yellow-500/10 text-yellow-400">
              <Circle size={14} />
            </div>
          </div>
          <div className="flex-1">
            <div className="glass rounded-xl p-3 border border-yellow-500/10">
              <span className="text-xs font-semibold text-yellow-400/80 mb-1 block">
                Alternative Interpretation
              </span>
              <p className="text-xs text-cream/50">{alternativeInterpretation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

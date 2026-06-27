import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLink, Database } from "lucide-react";
import type { EvidenceChunk } from "../../services/verificationService";

interface EvidenceViewerProps {
  evidence: EvidenceChunk[];
}

export default function EvidenceViewer({ evidence }: EvidenceViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (evidence.length === 0) {
    return (
      <div className="text-center py-6 text-cream/30 text-sm">
        No evidence found for this claim
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-cream/40 uppercase tracking-widest mb-3">
        Evidence ({evidence.length} sources)
      </h4>
      {evidence.map((ev) => {
        const isExpanded = expandedId === ev.id;
        return (
          <div
            key={ev.id}
            className="glass rounded-xl border border-cream/5 overflow-hidden"
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : ev.id)}
              className="w-full flex items-start gap-3 p-3 text-left hover:bg-cream/5 transition-colors"
            >
              <div className={`p-1.5 rounded-lg flex-shrink-0 ${
                ev.label === 'SUPPORTS' ? 'bg-green-500/10' :
                ev.label === 'REFUTES' ? 'bg-red-500/10' : 'bg-yellow-500/10'
              }`}>
                <Database size={14} className={
                  ev.label === 'SUPPORTS' ? 'text-green-400' :
                  ev.label === 'REFUTES' ? 'text-red-400' : 'text-yellow-400'
                } />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-cream/70 truncate">
                    {ev.datasetName}
                  </span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                    ev.label === 'SUPPORTS' ? 'bg-green-500/10 text-green-400' :
                    ev.label === 'REFUTES' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {ev.label}
                  </span>
                </div>
                <p className="text-xs text-cream/50 line-clamp-2">
                  {ev.evidence}
                </p>
                {ev.relevanceScore > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 flex-1 bg-cream/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-marigold/60 rounded-full"
                        style={{ width: `${ev.relevanceScore * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-cream/30">
                      {(ev.relevanceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
              {isExpanded ? <ChevronUp size={14} className="text-cream/30 flex-shrink-0" /> : <ChevronDown size={14} className="text-cream/30 flex-shrink-0" />}
            </button>
            {isExpanded && (
              <div className="px-3 pb-3 border-t border-cream/5 pt-2">
                <p className="text-xs text-cream/60 leading-relaxed mb-2">
                  {ev.evidence}
                </p>
                <div className="flex items-center gap-2 text-[10px] text-cream/30">
                  <span>Source: {ev.source}</span>
                  {ev.source.startsWith('http') && (
                    <a href={ev.source} target="_blank" rel="noopener noreferrer" className="text-marigold hover:underline flex items-center gap-1">
                      Visit <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

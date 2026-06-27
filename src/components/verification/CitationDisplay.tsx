import { BookOpen, Copy, Check } from "lucide-react";
import { useState } from "react";

interface Citation {
  dataset: string;
  record: string;
  evidence: string;
  format: string;
}

interface CitationDisplayProps {
  citations: Citation[];
}

export default function CitationDisplay({ citations }: CitationDisplayProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyCitation = async (citation: Citation, index: number) => {
    await navigator.clipboard.writeText(citation.format);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (citations.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-cream/40 uppercase tracking-widest mb-3 flex items-center gap-2">
        <BookOpen size={12} />
        Citations ({citations.length})
      </h4>
      {citations.map((cit, i) => (
        <div
          key={i}
          className="flex items-start gap-2 p-3 rounded-xl bg-cream/5 border border-cream/5"
        >
          <span className="text-[10px] font-bold text-marigold w-5 flex-shrink-0 mt-0.5">[{i + 1}]</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-cream/60 leading-relaxed">{cit.format}</p>
            <button
              onClick={() => copyCitation(cit, i)}
              className="flex items-center gap-1 text-[10px] text-marigold/60 hover:text-marigold mt-1 transition-colors"
            >
              {copiedIndex === i ? (
                <><Check size={10} /> Copied</>
              ) : (
                <><Copy size={10} /> Copy citation</>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

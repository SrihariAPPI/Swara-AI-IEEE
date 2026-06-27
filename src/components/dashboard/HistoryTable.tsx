import { useState, useEffect } from "react";
import { Clock, ShieldCheck, ShieldX, AlertTriangle, HelpCircle, ExternalLink } from "lucide-react";
import { getHistory, type VerificationResult } from "../../services/verificationService";

interface HistoryTableProps {
  onSelectResult?: (result: VerificationResult) => void;
}

const VERDICT_ICONS: Record<string, any> = {
  TRUE: ShieldCheck,
  FALSE: ShieldX,
  MISLEADING: AlertTriangle,
  PARTIALLY_TRUE: AlertTriangle,
  INSUFFICIENT_EVIDENCE: HelpCircle,
};

const VERDICT_COLORS: Record<string, string> = {
  TRUE: 'text-green-400', FALSE: 'text-red-400',
  MISLEADING: 'text-yellow-400', PARTIALLY_TRUE: 'text-orange-400',
  INSUFFICIENT_EVIDENCE: 'text-gray-400',
};

export default function HistoryTable({ onSelectResult }: HistoryTableProps) {
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (startAfter?: string) => {
    try {
      const data = await getHistory(20, startAfter);
      setHistory(prev => startAfter ? [...prev, ...data.items] : data.items);
      setHasMore(data.hasMore);
      setLastId(data.lastId);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-cream/30 text-sm">Loading history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock size={32} className="mx-auto text-cream/20 mb-2" />
        <p className="text-cream/30 text-sm">No verification history yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((item) => {
        const Icon = VERDICT_ICONS[item.verdict.label] || HelpCircle;
        const color = VERDICT_COLORS[item.verdict.label] || 'text-gray-400';

        return (
          <button
            key={item.id}
            onClick={() => onSelectResult?.(item)}
            className="w-full flex items-center gap-3 p-3 rounded-xl glass border border-cream/5 hover:border-marigold/20 hover:bg-cream/5 transition-all text-left"
          >
            <div className={`p-2 rounded-lg ${item.verdict.confidence >= 70 ? 'bg-green-500/10' : item.verdict.confidence >= 40 ? 'bg-yellow-500/10' : 'bg-red-500/10'}`}>
              <Icon size={16} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-cream/80 truncate">
                {item.claims?.[0]?.text || item.input.content.slice(0, 100)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-[10px] font-semibold ${color}`}>{item.verdict.label}</span>
                <span className="text-[10px] text-cream/30">{item.verdict.confidence}% confidence</span>
                <span className="text-[10px] text-cream/20">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <ExternalLink size={14} className="text-cream/20 flex-shrink-0" />
          </button>
        );
      })}
      {hasMore && (
        <button
          onClick={() => loadHistory(lastId!)}
          className="w-full py-3 text-xs text-marigold/60 hover:text-marigold transition-colors"
        >
          Load more...
        </button>
      )}
    </div>
  );
}

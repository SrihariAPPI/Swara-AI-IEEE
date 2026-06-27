import React, { useState } from "react";
import { FileText, Globe, Image, Type, Send, Loader2 } from "lucide-react";

interface InputPanelProps {
  onVerify: (type: 'text' | 'url' | 'pdf' | 'image', content: string, name?: string) => void;
  isProcessing: boolean;
}

export default function InputPanel({ onVerify, isProcessing }: InputPanelProps) {
  const [inputType, setInputType] = useState<'text' | 'url'>('text');
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isProcessing) return;
    onVerify(inputType, content.trim(), fileName || undefined);
    setContent('');
    setFileName('');
  };

  const inputTypes = [
    { id: 'text' as const, icon: Type, label: 'Text' },
    { id: 'url' as const, icon: Globe, label: 'URL' },
  ];

  return (
    <div className="glass rounded-2xl p-5 border border-marigold/10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-marigold/10 flex items-center justify-center border border-marigold/20">
          <FileText size={16} className="text-marigold" />
        </div>
        <h3 className="font-serif font-semibold text-marigold text-lg">Verify Information</h3>
      </div>

      <div className="flex gap-2 mb-4">
        {inputTypes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setInputType(id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              inputType === id
                ? 'bg-marigold/20 border border-marigold/40 text-marigold'
                : 'bg-cream/5 border border-cream/5 text-cream/50 hover:bg-cream/10'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {inputType === 'text' ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Paste a news article, claim, or statement to verify..."
            className="w-full bg-black/20 border border-cream/10 rounded-xl px-4 py-3 text-sm text-cream outline-none focus:border-marigold/50 transition-colors resize-none min-h-[120px]"
            rows={4}
          />
        ) : (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://example.com/article-to-verify"
            className="w-full bg-black/20 border border-cream/10 rounded-xl px-4 py-3 text-sm text-cream outline-none focus:border-marigold/50 transition-colors"
          />
        )}

        <button
          type="submit"
          disabled={!content.trim() || isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-marigold to-terracotta text-peacock font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-all"
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <Send size={16} />
              Verify Now
            </>
          )}
        </button>
      </form>
    </div>
  );
}

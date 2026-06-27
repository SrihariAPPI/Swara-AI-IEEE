import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, FileText } from "lucide-react";

interface PdfSearchModalProps {
  pdfContexts: { id: string; name: string; data: string; mimeType: string; selected: boolean }[];
  onClose: () => void;
}

export default function PdfSearchModal({ pdfContexts, onClose }: PdfSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || pdfContexts.length === 0) return [];
    
    const query = searchQuery.toLowerCase();
    const results: { pdfName: string; snippet: string; matchIndex: number }[] = [];

    pdfContexts.forEach(pdf => {
      const text = pdf.data.toLowerCase();
      let startIndex = 0;
      
      while (startIndex < text.length) {
        const matchIndex = text.indexOf(query, startIndex);
        if (matchIndex === -1) break;
        
        // Extract snippet
        const startSnippet = Math.max(0, matchIndex - 60);
        const endSnippet = Math.min(pdf.data.length, matchIndex + query.length + 60);
        let snippet = pdf.data.substring(startSnippet, endSnippet);
        
        // Handle word boundaries loosely
        if (startSnippet > 0) snippet = "..." + snippet;
        if (endSnippet < pdf.data.length) snippet = snippet + "...";

        // Avoid adding too many results from a single PDF for the same word close together
        // We'll advance startIndex by a reasonable amount to find the *next* occurrence
        results.push({ pdfName: pdf.name, snippet, matchIndex });
        
        startIndex = matchIndex + query.length + 100;
        
        // Limit results per search to prevent freezing
        if (results.length > 50) break;
      }
    });

    return results;
  }, [searchQuery, pdfContexts]);

  // Highlighter utility
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return (
      <>
        {parts.map((part, i) => 
          regex.test(part) ? <span key={i} className="bg-marigold text-black font-bold px-1 rounded-sm">{part}</span> : part
        )}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl max-h-[85vh] glass border border-marigold/30 shadow-2xl rounded-2xl flex flex-col overflow-hidden text-cream"
      >
        <div className="flex items-center justify-between p-4 border-b border-cream/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-marigold/20 rounded-lg text-marigold">
              <Search size={20} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">Search in PDFs</h2>
              <p className="text-xs text-cream/50">Search text across {pdfContexts.length} uploaded document(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-cream/50 hover:text-cream transition-colors rounded-full hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-cream/5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" size={18} />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type to search within PDFs..."
              className="w-full bg-cream/5 border border-cream/10 rounded-xl py-3 pl-12 pr-4 text-sm text-cream placeholder-cream/40 outline-none focus:border-marigold/50 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {searchQuery.trim() === "" ? (
            <div className="h-40 flex flex-col items-center justify-center text-cream/30 space-y-3">
              <FileText size={40} className="opacity-50" />
              <p className="text-sm">Enter a keyword to search through the contents of your active PDFs.</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-cream/50 text-sm">
              No matches found for "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-marigold font-semibold tracking-wider uppercase pl-1">
                {searchResults.length} {searchResults.length === 51 ? 'or more ' : ''}Matches Found
              </p>
              {searchResults.map((result, idx) => (
                <div key={idx} className="bg-cream/5 border border-cream/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={14} className="text-marigold" />
                    <span className="text-xs font-medium text-cream/70">{result.pdfName}</span>
                  </div>
                  <p className="text-sm leading-relaxed text-cream/90 font-serif whitespace-pre-wrap">
                    {highlightMatch(result.snippet, searchQuery)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
